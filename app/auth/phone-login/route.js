import { NextResponse } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const GENERIC = 'Nomor HP atau kata sandi salah.';

export async function POST(request) {
  try {
    const { phone, password } = await request.json().catch(() => ({}));
    if (typeof phone !== 'string' || typeof password !== 'string' || !phone.trim() || !password) {
      return NextResponse.json({ error: GENERIC }, { status: 400 });
    }

    // 1. Cari email dari nomor HP (fungsi database hanya bisa dipanggil service role)
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: email, error: lookupError } = await admin.rpc('find_email_by_phone', { p_phone: phone });
    if (lookupError) {
      console.error('phone-login lookup error:', lookupError);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
    if (!email) return NextResponse.json({ error: GENERIC }, { status: 401 });

    // 2. Masuk dengan email + kata sandi; cookie sesi dibuat oleh client server
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        return NextResponse.json({ error: 'Email Anda belum diverifikasi. Selesaikan pendaftaran lebih dulu.' }, { status: 401 });
      }
      return NextResponse.json({ error: GENERIC }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/auth/phone-login error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
