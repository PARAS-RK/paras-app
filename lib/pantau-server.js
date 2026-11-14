import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


export const STATUS_GROUPS = {
  pending: ['submitted'],
  in_progress: ['in_review', 'in_progress'],
  handled: ['resolved'],
  rejected: ['rejected'],
};

// ASUMSI: jalur_a = Komunitas PKK, jalur_b = BPBD.
export const HANDLER_BY_ROUTE = { jalur_a: 'pkk', jalur_b: 'bpbd' };

// Laporan warga lain dengan status ini TIDAK tampil di tab "Laporan Warga".
export const COMMUNITY_HIDDEN_STATUSES = ['rejected'];

// Detail lokasi (jalan, RT/RW, patokan) hanya terlihat oleh pelapor.
// jika warga satu kelurahan boleh melihatnya.
export const SHOW_LOCATION_DETAIL_TO_COMMUNITY = false;

// Akun dengan status ini tidak boleh melihat laporan warga lain.
const BLOCKED_ACCOUNT_STATUSES = ['suspended', 'rejected'];
const UI_STATUS_BY_RAW = Object.fromEntries(Object.entries(STATUS_GROUPS).flatMap(([ui, raws]) => raws.map((raw) => [raw, ui])));

export const toUiStatus = (raw) => UI_STATUS_BY_RAW[raw] ?? 'pending';
export const one = (value) => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));

export function parseReportId(raw) {
  return /^\d{1,15}$/.test(String(raw)) ? Number(raw) : null;
}

export function sanitizeSearch(raw) {
  return String(raw ?? '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

export async function getPantauContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from('profiles').select('region_id, account_status').eq('user_id', data.user.id).maybeSingle();
  if (profileError) throw profileError;

  const regionId = profile?.region_id ?? null;
  const blocked = BLOCKED_ACCOUNT_STATUSES.includes(profile?.account_status);

  return {
    admin,
    user: data.user,
    regionId,
    canSeeCommunity: Boolean(regionId) && !blocked,
  };
}

// Boleh dilihat jika milik sendiri, atau milik warga lain di kelurahan yang sama
export function canViewRow(row, ctx) {
  if (row.user_id === ctx.user.id) return true;
  return ctx.canSeeCommunity && row.region_id === ctx.regionId && !COMMUNITY_HIDDEN_STATUSES.includes(row.report_status);
}

// Mengembalikan null (bukan 403) jika tidak boleh dilihat, agar keberadaan laporan tidak bocor.
export async function getViewableReport(ctx, reportId, select) {
  const { data, error } = await ctx.admin.from('reports').select(select).eq('report_id', reportId).maybeSingle();
  if (error) throw error;
  return data && canViewRow(data, ctx) ? data : null;
}

export const REPORT_LIST_SELECT = [
  'report_id',
  'ticket_code',
  'report_description',
  'report_status',
  'created_at',
  'is_anonymous',
  'user_id',
  'region_id',
  'location_detail',
  'report_category',
  'report_categories(label)',
  'regions(subdistrict)',
  'profiles!reports_user_id_fkey(full_name, hide_name)',
  'report_votes(count)',
].join(', ');

export function mapReport(row, ctx) {
  const isMine = row.user_id === ctx.user.id;
  const description = row.report_description ?? '';

  let reporter = 'Warga';
  if (isMine) reporter = 'Anda';
  else {
    const profile = one(row.profiles);
    if (row.is_anonymous || profile?.hide_name) reporter = 'Warga (anonim)';
    else reporter = profile?.full_name ?? 'Warga';
  }

  return {
    id: row.report_id,
    ticketCode: row.ticket_code,
    title: one(row.report_categories)?.label ?? row.report_category,
    excerpt: description.length > 120 ? `${description.slice(0, 120).trimEnd()}…` : description,
    area: one(row.regions)?.subdistrict ?? null,
    location: isMine || SHOW_LOCATION_DETAIL_TO_COMMUNITY ? row.location_detail : null,
    createdAt: row.created_at,
    status: toUiStatus(row.report_status),
    rawStatus: row.report_status,
    isMine,
    reporter,
    voteCount: one(row.report_votes)?.count ?? 0,
  };
}
