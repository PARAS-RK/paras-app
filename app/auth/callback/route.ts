// app/auth/callback/route.ts
import { NextResponse } from 'next/server';

// The client you created from the Server-Side Auth instructions
import { createClient } from '../../../lib/supabase/server';

// Pesan error dari Supabase saat pembuatan user baru ditolak (lihat trigger block_google_signup)
const SIGNUP_BLOCKED = /database error saving new user|google_signup_disabled/i;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Akun Google yang belum terdaftar ditolak oleh database. Arahkan ke halaman masuk dengan pesan.
  const providerError = searchParams.get('error_description') ?? '';
  if (!code && SIGNUP_BLOCKED.test(providerError)) {
    return NextResponse.redirect(`${origin}/login?error=google_not_registered`);
  }

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/') || next.startsWith('//')) {
    // if "next" is not a relative URL, use the default
    next = '/';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    if (SIGNUP_BLOCKED.test(error.message)) {
      return NextResponse.redirect(`${origin}/login?error=google_not_registered`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
