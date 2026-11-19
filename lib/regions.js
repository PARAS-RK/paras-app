import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

// Format kode kelurahan di list_regions & regions: 11.01.01.2001
const SUBDISTRICT_RE = /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/;

export async function resolveRegionChain(subdistrictCode) {
  if (!SUBDISTRICT_RE.test(subdistrictCode ?? '')) return null;

  const admin = createAdminClient();
  const chain = [];
  let code = subdistrictCode;

  for (let i = 0; i < 4; i++) {
    const { data, error } = await admin.from('list_regions').select('kode, nama, kode_induk').eq('kode', code).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    chain.push(data);
    if (!data.kode_induk) break;
    code = data.kode_induk;
  }

  // 4 tingkat: kelurahan -> kecamatan -> kota -> provinsi (provinsi tanpa induk)
  if (chain.length !== 4 || chain[3].kode_induk) return null;

  const [sub, dist, city, prov] = chain;
  return {
    subdistrict_code: sub.kode,
    subdistrict: sub.nama,
    district_code: dist.kode,
    district: dist.nama,
    city_code: city.kode,
    city: city.nama,
    province_code: prov.kode,
    province: prov.nama,
  };
}
