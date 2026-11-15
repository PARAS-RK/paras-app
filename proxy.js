import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const LOGIN_PATH = '/login';
const ADMIN_LOGIN_PATH = '/admin/login';
const REGISTER_PATH = '/register';
const HOME_PATH = '/home';
const MAINTENANCE_PATH = '/maintenance';

const PROTECTED_PREFIXES = ['/home', '/aksi', '/info', '/lapor', '/pantau', '/profile', '/store', '/api/lapor', '/api/pantau', '/api/profile'];
const LEADER_PREFIXES = ['/admin'];
const PUBLIC_EXCEPTIONS = ['/admin/login', '/pkk/community'];
// ---------------------------------------------------------------------

const matches = (pathname, prefixes) => prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

function isMaintenanceOn() {
  return String(process.env.MAINTENANCE_MODE || '').toLowerCase() === 'true';
}

function handleMaintenance(request) {
  const { pathname, searchParams } = request.nextUrl;
  const bypassKey = process.env.MAINTENANCE_BYPASS_KEY;

  if (bypassKey) {
    if (searchParams.get('bypass') === bypassKey) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete('bypass');
      const res = NextResponse.redirect(clean);
      res.cookies.set('maintenance_bypass', bypassKey, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 8,
      });
      return res;
    }
    if (request.cookies.get('maintenance_bypass')?.value === bypassKey) return null;
  }

  if (pathname === MAINTENANCE_PATH) return null;

  if (pathname.startsWith('/api') || !['GET', 'HEAD'].includes(request.method)) {
    return new NextResponse(JSON.stringify({ message: 'Layanan sedang dalam pemeliharaan. Silakan coba lagi nanti.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '3600', 'Cache-Control': 'no-store' },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = MAINTENANCE_PATH;
  url.search = '';
  return NextResponse.rewrite(url, {
    status: 503,
    headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' },
  });
}

async function getUserId(supabase) {
  if (typeof supabase.auth.getClaims === 'function') {
    const { data } = await supabase.auth.getClaims();
    return data?.claims?.sub ?? null;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function redirectTo(request, supabaseResponse, pathname, params = {}) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

function jsonError(supabaseResponse, status, message) {
  const res = NextResponse.json({ message }, { status });
  supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. Maintenance
  if (isMaintenanceOn()) {
    const res = handleMaintenance(request);
    if (res) return res;
  } else if (pathname === MAINTENANCE_PATH) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname === '/reset-password' && !request.cookies.get('pw_recovery')) {
    return NextResponse.redirect(new URL('/forgot-password', request.url));
  }

  // 2. Perlu cek sesi?
  const isException = matches(pathname, PUBLIC_EXCEPTIONS);
  const isLeaderRoute = matches(pathname, LEADER_PREFIXES) && !isException;
  const isProtected = !isException && (matches(pathname, PROTECTED_PREFIXES) || isLeaderRoute);
  const hasSessionCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

  if (!isProtected && !hasSessionCookie) return NextResponse.next();

  // 3. Segarkan sesi
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });

  const userId = await getUserId(supabase);

  if (!isProtected) return supabaseResponse;

  // 4. Halaman terlindungi: harus login
  const isApi = pathname.startsWith('/api');
  if (!userId) {
    if (isApi) return jsonError(supabaseResponse, 401, 'Silakan masuk terlebih dahulu.');
    return redirectTo(request, supabaseResponse, isLeaderRoute ? ADMIN_LOGIN_PATH : LOGIN_PATH, { next: pathname });
  }

  // 5. ...dan akun harus 'active'
  const { data: profile } = await supabase.from('profiles').select('account_status').eq('user_id', userId).maybeSingle();
  if (profile?.account_status !== 'active') {
    if (isApi) return jsonError(supabaseResponse, 403, 'Akun Anda belum aktif.');
    return redirectTo(request, supabaseResponse, REGISTER_PATH);
  }

  // 6. Halaman ketua PKK: harus leader aktif
  if (isLeaderRoute) {
    const { data: regionId } = await supabase.rpc('leader_region_id');
    if (!regionId) return redirectTo(request, supabaseResponse, HOME_PATH);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Semua rute kecuali file statis & gambar
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)',
  ],
};
