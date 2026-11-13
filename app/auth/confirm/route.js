import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Menerima tautan dari email (reset kata sandi):
const ALLOWED_TYPES = ['recovery'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  let next = searchParams.get('next') ?? '/reset-password';

  // Cegah open redirect: hanya path internal
  if (!next.startsWith('/') || next.startsWith('//')) next = '/reset-password';

  if (tokenHash && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      const url = request.nextUrl.clone();
      url.pathname = next;
      url.search = '';
      const res = NextResponse.redirect(url);

      res.cookies.set('pw_recovery', '1', {
        path: '/',
        maxAge: 60 * 15,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return res;
    }
    console.error('Verifikasi tautan reset gagal:', error.message);
  }

  const fail = request.nextUrl.clone();
  fail.pathname = '/forgot-password';
  fail.search = '?error=link';
  return NextResponse.redirect(fail);
}
