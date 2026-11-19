import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const KOLOM =
  'data_type, status, payload, summary_text, summary_source, source_issued_at, fetched_at, expired_at';

/**
 * Handler GET untuk satu jenis data bmkg_cache.
 * Wilayah tidak dikirim dari client: RLS otomatis membatasi baris
 * ke kelurahan milik user yang sedang login.
 */
export function buatHandlerBmkg(dataType) {
  return async function GET() {
    const supabase = await createClient(); // await aman walau createClient-mu sinkron

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Belum login' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('bmkg_cache')
      .select(KOLOM)
      .eq('data_type', dataType)
      .maybeSingle();

    if (error) {
      console.error(`[api/bmkg/${dataType}]`, error);
      return NextResponse.json({ error: 'Gagal membaca data BMKG' }, { status: 500 });
    }

    // data = null kalau pipeline belum pernah mengisi / wilayah user belum diatur
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'private, no-store' } });
  };
}