import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALLOWED_IMAGE_TYPES, detectImageType, validateReportFields } from '@/lib/lapor-validation';

const BUCKET = 'bukti-laporan';
const MAX_REPORTS_PER_HOUR = 5;
const BLOCKED_STATUSES = ['suspended', 'rejected'];

const fail = (error, status, extra = {}) => NextResponse.json({ error, ...extra }, { status });

async function getAuthedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data?.user ? null : data.user;
}

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) return fail('Silakan masuk terlebih dahulu', 401);

    const admin = createAdminClient();
    const [profileRes, categoriesRes] = await Promise.all([
      admin
        .from('profiles')
        .select('full_name, hide_name, account_status, region_id, regions(subdistrict, district, city)')
        .eq('user_id', user.id)
        .maybeSingle(),
      admin.from('report_categories').select('category_code, label').eq('is_active', true).order('sort_order', { ascending: true }),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    if (!profileRes.data) return fail('Profil Anda belum dibuat', 403);

    const profile = profileRes.data;
    const region = Array.isArray(profile.regions) ? profile.regions[0] : profile.regions;

    return NextResponse.json({
      profile: {
        displayName: profile.full_name,
        hideName: Boolean(profile.hide_name),
        accountStatus: profile.account_status,
        hasRegion: Boolean(region),
        areaLabel: region?.subdistrict ?? null,
        areaFull: region ? `${region.subdistrict}, ${region.city}` : null,
      },
      categories: categoriesRes.data.map((c) => ({ code: c.category_code, label: c.label })),
    });
  } catch (err) {
    console.error('[GET /api/lapor]', err);
    return fail('Terjadi kesalahan server', 500);
  }
}

export async function POST(request) {
  const admin = createAdminClient();
  let tmpPath = null;
  let finalPath = null;
  let createdReportId = null;

  try {
    const user = await getAuthedUser();
    if (!user) return fail('Silakan masuk terlebih dahulu', 401);

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return fail('Permintaan tidak valid', 400);
    }

    const category = String(formData.get('category') ?? '').trim();
    const location = String(formData.get('location') ?? '').trim();
    const details = String(formData.get('details') ?? '').trim();
    const isAnonymous = formData.get('isAnonymous') === 'true';
    const file = formData.get('file');

    const fieldErrors = validateReportFields({ category, location, details, file });
    if (Object.keys(fieldErrors).length) {
      return fail('Periksa kembali isian Anda', 400, { fieldErrors });
    }

    const { data: profile, error: profileError } = await admin.from('profiles').select('account_status, region_id').eq('user_id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return fail('Profil Anda belum dibuat', 403);
    if (BLOCKED_STATUSES.includes(profile.account_status)) {
      return fail('Akun Anda tidak dapat membuat laporan saat ini', 403);
    }
    if (!profile.region_id) {
      return fail('Lengkapi wilayah pada profil Anda sebelum membuat laporan', 400);
    }

    const { data: cat, error: catError } = await admin.from('report_categories').select('category_code').eq('category_code', category).eq('is_active', true).maybeSingle();
    if (catError) throw catError;
    if (!cat) return fail('Kategori tidak valid', 400, { fieldErrors: { category: 'Kategori tidak valid' } });

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin.from('reports').select('report_id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_REPORTS_PER_HOUR) {
      return fail('Anda terlalu sering mengirim laporan. Coba lagi beberapa saat lagi.', 429);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = detectImageType(buffer);
    if (!mime) {
      return fail('File bukan gambar yang valid', 400, {
        fieldErrors: { file: 'File bukan gambar JPG, PNG, atau WebP yang valid' },
      });
    }
    const fileName = `${randomUUID()}.${ALLOWED_IMAGE_TYPES[mime]}`;

    tmpPath = `tmp/${user.id}/${fileName}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(tmpPath, buffer, { contentType: mime, upsert: false });
    if (uploadError) throw uploadError;

    const { data: report, error: insertError } = await admin
      .from('reports')
      .insert({
        user_id: user.id,
        region_id: profile.region_id,
        report_category: category,
        report_description: details,
        location_detail: location,
        is_anonymous: isAnonymous,
      })
      .select('report_id, ticket_code')
      .single();
    if (insertError) throw insertError;
    createdReportId = report.report_id;

    finalPath = `${report.report_id}/${fileName}`;
    const { error: moveError } = await admin.storage.from(BUCKET).move(tmpPath, finalPath);
    if (moveError) throw moveError;
    tmpPath = null;

    const { error: mediaError } = await admin.from('reports_media').insert({
      report_id: report.report_id,
      path_storage: finalPath,
      file_type: 'image',
      number_file: 1,
    });
    if (mediaError) throw mediaError;

    return NextResponse.json({ reportId: report.report_id, ticketCode: report.ticket_code }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/lapor]', err);

    try {
      const toRemove = [tmpPath, finalPath].filter(Boolean);
      if (toRemove.length) await admin.storage.from(BUCKET).remove(toRemove);
      if (createdReportId) await admin.from('reports').delete().eq('report_id', createdReportId);
    } catch (cleanupErr) {
      console.error('[POST /api/lapor] pembersihan gagal', cleanupErr);
    }

    return fail('Terjadi kesalahan server. Silakan coba lagi.', 500);
  }
}
