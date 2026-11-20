import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['recovery'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  let next = searchParams.get('next') ?? '/reset-password';

  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/reset-password';
  }

  const siteUrl = process.env.SITE_URL || request.nextUrl.origin;

  if (tokenHash && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const redirectUrl = new URL(next, siteUrl);
      redirectUrl.search = '';

      const res = NextResponse.redirect(redirectUrl);

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

  // Jika token gagal, kembali ke halaman forgot password
  const failUrl = new URL('/forgot-password', siteUrl);
  failUrl.searchParams.set('error', 'link');

  return NextResponse.redirect(failUrl);
}
