'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { resolveRegionChain } from '@/lib/regions';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^08\d{8,12}$/;

function normalizePhone(raw = '') {
  const p = String(raw).replace(/[\s\-().]/g, '');
  if (p.startsWith('+62')) return '0' + p.slice(3);
  if (p.startsWith('62')) return '0' + p.slice(2);
  return p;
}

export async function registerCommunity(input) {
  const admin = createAdminClient();

  let userId = null;
  let unitId = null;

  async function rollback() {
    try {
      if (userId) await admin.from('pkk_members').delete().eq('user_id', userId);
      if (unitId) await admin.from('pkk_units').delete().eq('pkk_unit_id', unitId);
      if (userId) await admin.auth.admin.deleteUser(userId);
    } catch (cleanupErr) {
      console.error('Rollback gagal:', cleanupErr);
    }
  }

  try {
    // 0. Bersihkan & validasi di server
    const chairName = String(input.chairName || '').trim();
    const chairEmail = String(input.chairEmail || '')
      .trim()
      .toLowerCase();
    const chairPhone = normalizePhone(input.chairPhone);
    const password = String(input.password || '');

    if (!chairName) return { success: false, message: 'Nama ketua wajib diisi.' };
    if (!EMAIL_RE.test(chairEmail)) return { success: false, message: 'Format email tidak valid.' };
    if (!PHONE_RE.test(chairPhone)) return { success: false, message: 'Nomor HP tidak valid.' };
    if (password.length < 8) return { success: false, message: 'Kata sandi minimal 8 karakter.' };
    if (password !== input.confirmPassword) return { success: false, message: 'Konfirmasi kata sandi tidak cocok.' };

    // 1. Wilayah
    const chain = await resolveRegionChain(input.subdistrictCode);
    if (!chain) return { success: false, message: 'Data wilayah tidak valid.' };

    const { data: region, error: regionError } = await admin.from('regions').upsert(chain, { onConflict: 'subdistrict_code' }).select('region_id').single();
    if (regionError) throw regionError;

    // 2. Satu kelurahan = satu unit PKK
    const { data: existingUnit, error: unitCheckErr } = await admin.from('pkk_units').select('pkk_unit_id').eq('region_id', region.region_id).maybeSingle();
    if (unitCheckErr) throw unitCheckErr;
    if (existingUnit) {
      return { success: false, message: 'Komunitas PKK untuk kelurahan ini sudah terdaftar.' };
    }

    // 3. Nomor HP harus belum dipakai profil lain
    const { data: phoneUsed, error: phoneErr } = await admin.from('profiles').select('user_id').eq('phone_number', chairPhone).limit(1);
    if (phoneErr) throw phoneErr;
    if (phoneUsed?.length) return { success: false, message: 'Nomor HP ini sudah terdaftar.' };

    // 4. Akun auth ketua.
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: chairEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: chairName,
        phone: chairPhone,
        account_type: 'pkk_leader',
      },
    });

    if (authError) {
      console.error('createUser error:', authError);
      if (authError.code === 'email_exists' || /already|registered|exists/i.test(authError.message)) {
        return { success: false, message: 'Email ini sudah terdaftar. Gunakan email lain atau masuk.' };
      }
      return { success: false, message: 'Gagal membuat akun. Silakan coba lagi.' };
    }
    userId = authData.user.id;

    // 5. Profil sudah dibuat trigger (status pending) -> lengkapi & aktifkan
    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        user_id: userId,
        full_name: chairName,
        phone_number: chairPhone,
        account_category: 'anggota_pkk',
        account_status: 'active',
        region_id: region.region_id,
        status_reason: null,
        status_changed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (profileErr) throw profileErr;

    // 6. Unit PKK untuk kelurahan ini (format kode sama dengan handle_user_confirmed, maks 30 karakter)
    const nameSlug = chain.subdistrict
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 17);
    const pkkCode = `PKK-${nameSlug}-${region.region_id}`.slice(0, 30);
    const { data: pkkUnit, error: unitError } = await admin
      .from('pkk_units')
      .insert({
        region_id: region.region_id,
        unit_name: `PKK ${chain.subdistrict}`.slice(0, 150),
        pkk_code_area: pkkCode,
        verification_status: 'pending',
      })
      .select('pkk_unit_id')
      .single();

    if (unitError) {
      await rollback();
      if (unitError.code === '23505') {
        // keduluan pendaftar lain di kelurahan yang sama
        return { success: false, message: 'Komunitas PKK untuk kelurahan ini sudah terdaftar.' };
      }
      throw unitError;
    }
    unitId = pkkUnit.pkk_unit_id;

    // 7. Ketua sebagai leader
    const { error: memberErr } = await admin.from('pkk_members').upsert(
      {
        user_id: userId,
        pkk_unit_id: unitId,
        member_role: 'leader',
        status: 'verified',
        decided_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (memberErr) throw memberErr;

    return { success: true };
  } catch (err) {
    console.error('Registration Error:', err);
    await rollback();
    return { success: false, message: 'Gagal memproses pendaftaran komunitas.' };
  }
}
