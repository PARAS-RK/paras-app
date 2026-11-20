import { NextResponse } from 'next/server';

import { createClient } from '../../../lib/supabase/server';

const SIGNUP_BLOCKED = /database error saving new user|google_signup_disabled/i;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  const providerError = searchParams.get('error_description') ?? '';
  if (!code && SIGNUP_BLOCKED.test(providerError)) {
    return NextResponse.redirect(`${origin}/login?error=google_not_registered`);
  }

  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
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

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
