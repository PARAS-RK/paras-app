'use server';

import { createAdminClient } from '@/lib/supabase/admin.js';

// Rapikan nomor HP agar lolos constraint profiles_phone_number_check (^\+?[0-9]{8,15}$)
function normalizePhone(value) {
  return String(value || '').replace(/[^0-9+]/g, '');
}

export async function registerCommunity(input) {
  const admin = createAdminClient();

  // Dipakai untuk membatalkan data setengah jadi jika ada langkah yang gagal
  let userId = null;
  let unitId = null;

  async function rollback() {
    try {
      if (unitId) await admin.from('pkk_units').delete().eq('pkk_unit_id', unitId);
      // Menghapus user otomatis menghapus profiles & pkk_members (ON DELETE CASCADE)
      if (userId) await admin.auth.admin.deleteUser(userId);
    } catch (cleanupErr) {
      console.error('Rollback gagal:', cleanupErr);
    }
  }

  try {
    const email = String(input.chairEmail || '')
      .trim()
      .toLowerCase();
    const fullName = String(input.chairName || '').trim();
    const phone = normalizePhone(input.chairPhone);
    const subdistrictName = String(input.subdistrictName || '').trim();

    // 1. Cari wilayah; buat jika kelurahan ini pertama kali didaftarkan
    const { data: found, error: regionError } = await admin.from('regions').select('region_id').eq('subdistrict_code', input.subdistrictCode).maybeSingle();
    if (regionError) throw regionError;

    let region = found;
    if (!region) {
      const { data: newRegion, error: insertRegionErr } = await admin
        .from('regions')
        .insert({
          province_code: input.provinceCode,
          province: input.provinceName,
          city_code: input.cityCode,
          city: input.cityName,
          district_code: input.districtCode,
          district: input.districtName,
          subdistrict_code: input.subdistrictCode,
          subdistrict: subdistrictName,
        })
        .select('region_id')
        .single();
      if (insertRegionErr) throw insertRegionErr;
      region = newRegion;
    }

    // 2. Kelurahan ini sudah punya unit PKK?
    const { data: existingUnit, error: unitCheckErr } = await admin.from('pkk_units').select('pkk_unit_id').eq('region_id', region.region_id).maybeSingle();
    if (unitCheckErr) throw unitCheckErr;
    if (existingUnit) {
      return { success: false, message: 'Komunitas PKK untuk Kelurahan ini sudah terdaftar.' };
    }

    // 3. Buat akun Ketua PKK.
    //    account_type 'pkk_leader' WAJIB: trigger handle_new_user menolak akun lain
    //    di kelurahan yang belum punya unit PKK ("Database error creating user").
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        account_type: 'pkk_leader',
      },
    });

    if (authError) {
      const msg = /already|registered|exists/i.test(authError.message) ? 'Email ini sudah terdaftar. Gunakan email lain atau masuk.' : authError.message;
      return { success: false, message: msg };
    }
    userId = authData.user.id;

    // 4. Profil sudah dibuat trigger (status pending) -> lengkapi & aktifkan
    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phone,
        account_category: 'anggota_pkk',
        account_status: 'active',
        region_id: region.region_id,
        status_reason: null,
        status_changed_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (profileErr) {
      await rollback();
      if (profileErr.code === '23505') {
        return { success: false, message: 'Nomor HP ini sudah terdaftar pada akun lain.' };
      }
      throw profileErr;
    }

    // 5. Buat unit PKK untuk kelurahan ini
    const pkkCode = `PKK-${subdistrictName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 17)}-${region.region_id}`.slice(0, 30);
    const { data: pkkUnit, error: unitError } = await admin
      .from('pkk_units')
      .insert({
        region_id: region.region_id,
        unit_name: `PKK ${subdistrictName}`.slice(0, 150),
        pkk_code_area: pkkCode,
        verification_status: 'pending',
      })
      .select('pkk_unit_id')
      .single();

    if (unitError) {
      await rollback();
      if (unitError.code === '23505') {
        // keduluan pendaftar lain di kelurahan yang sama
        return { success: false, message: 'Komunitas PKK untuk Kelurahan ini sudah terdaftar.' };
      }
      throw unitError;
    }
    unitId = pkkUnit.pkk_unit_id;

    // 6. Jadikan ketua sebagai leader
    const { error: memberErr } = await admin.from('pkk_members').insert({
      user_id: userId,
      pkk_unit_id: unitId,
      member_role: 'leader',
    });

    if (memberErr) {
      await rollback();
      throw memberErr;
    }

    return { success: true };
  } catch (err) {
    console.error('Registration Error:', err);
    await rollback();
    return { success: false, message: 'Gagal memproses pendaftaran komunitas.' };
  }
}
