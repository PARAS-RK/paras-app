import { createClient } from '@/lib/supabase/client';

/**
 * Ambil wilayah user yang sedang login.
 * status: 'siap' | 'belum_login' | 'tanpa_wilayah' | 'error'
 */
export async function ambilWilayahUser() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: 'belum_login' };

  const { data, error } = await supabase
    .from('profiles')
    .select('region_id, regions(region_id, subdistrict_code, subdistrict, district, city, province)')
    .eq('user_id', user.id)
    .single();

  if (error) return { status: 'error', error };

  const r = data?.regions;
  if (!r?.subdistrict_code) return { status: 'tanpa_wilayah' };

  return {
    status: 'siap',
    wilayah: {
      regionId: r.region_id,
      kodeArea: r.subdistrict_code, // sama persis dengan bmkg_cache.area_code
      kelurahan: r.subdistrict,
      nama: [r.subdistrict, r.district, r.city].filter(Boolean).join(', '),
    },
  };
}