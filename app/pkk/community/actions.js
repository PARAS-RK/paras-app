'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function registerCommunity(input) {
  const admin = createAdminClient();

  try {
    let { data: region, error: regionError } = await admin.from('regions').select('region_id').eq('subdistrict_code', input.subdistrictCode).maybeSingle();

    if (!region) {
      // Masukkan ke tabel regions jika wilayah ini pertama kali didaftarkan
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
          subdistrict: input.subdistrictName,
        })
        .select('region_id')
        .single();

      if (insertRegionErr) throw insertRegionErr;
      region = newRegion;
    }

    // 2. Cek apakah Kelurahan ini (region_id) sudah punya unit PKK yang terdaftar
    const { data: existingUnit } = await admin.from('pkk_units').select('pkk_unit_id').eq('region_id', region.region_id).maybeSingle();

    if (existingUnit) {
      return { success: false, message: 'Komunitas PKK untuk Kelurahan ini sudah terdaftar.' };
    }

    // 3. Buat User Auth Supabase untuk Ketua PKK
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: input.chairEmail,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.chairName,
        phone_number: input.chairPhone,
      },
    });

    if (authError) return { success: false, message: authError.message };

    const userId = authData.user.id;

    // 4. Insert Profile
    await admin.from('profiles').insert({
      user_id: userId,
      full_name: input.chairName,
      phone_number: input.chairPhone,
      account_category: 'anggota_pkk',
      account_status: 'active',
    });

    // 5. Insert Unit PKK terhubung ke `region_id`
    const pkkCode = `PKK-${input.subdistrictName.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
    const { data: pkkUnit, error: unitError } = await admin
      .from('pkk_units')
      .insert({
        region_id: region.region_id,
        unit_name: `PKK ${input.subdistrictName}`,
        pkk_code_area: pkkCode,
        verification_status: 'pending',
      })
      .select('pkk_unit_id')
      .single();

    if (unitError) throw unitError;

    // 6. Ikat Ketua sebagai Leader di `pkk_members`
    await admin.from('pkk_members').insert({
      user_id: userId,
      pkk_unit_id: pkkUnit.pkk_unit_id,
      member_role: 'leader',
    });

    return { success: true };
  } catch (err) {
    console.error('Registration Error:', err);
    return { success: false, message: 'Gagal memproses pendaftaran komunitas.' };
  }
}
