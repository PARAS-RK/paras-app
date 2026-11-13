import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Halaman yang wajib login
const PROTECTED = ['/lapor', '/pantau'];
// Halaman yang tidak perlu dibuka lagi kalau sudah login
const AUTH_PAGES = ['/login', '/register'];

export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Gunakan getUser(), bukan getSession(): getUser() memverifikasi token ke server Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Belum login → arahkan ke /login
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Sudah login tapi membuka /login atau /register → arahkan ke /lapor
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/lapor';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
