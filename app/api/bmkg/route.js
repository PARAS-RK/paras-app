import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const KOLOM =
  'data_type, status, payload, summary_text, summary_source, source_issued_at, fetched_at, expired_at';

/**
 * GET /api/bmkg
 * Semua data BMKG (cuaca, peringatan, gempa_rasa, gempa_besar) untuk wilayah user, sekali panggil.
 * RLS membatasi baris ke kelurahan user yang login.
 * 200 { data: { <data_type>: Row } } | 401 { error } | 500 { error }
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }

  const { data, error } = await supabase.from('bmkg_cache').select(KOLOM);
  if (error) {
    console.error('[api/bmkg]', error);
    return NextResponse.json({ error: 'Gagal membaca data BMKG' }, { status: 500 });
  }

  const rows = Object.fromEntries((data ?? []).map((r) => [r.data_type, r]));
  return NextResponse.json({ data: rows }, { headers: { 'Cache-Control': 'private, no-store' } });
}