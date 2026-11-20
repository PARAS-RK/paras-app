'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function getRegionOptions(parentCode = null) {
  // Kode induk berformat 11, 11.01, atau 11.01.01
  if (parentCode && !/^\d{2}(\.\d{2}){0,2}$/.test(parentCode)) {
    return { success: false, options: [] };
  }

  const admin = createAdminClient();
  let query = admin.from('list_regions').select('kode, nama').order('nama', { ascending: true }).limit(1000);
  query = parentCode ? query.eq('kode_induk', parentCode) : query.is('kode_induk', null);

  const { data, error } = await query;
  if (error) {
    console.error('getRegionOptions error:', error);
    return { success: false, options: [] };
  }

  return { success: true, options: data.map((r) => ({ id: r.kode, name: r.nama })) };
}
