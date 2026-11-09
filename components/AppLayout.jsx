'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MessageCircle, Flag, User, ArrowLeft, CloudSun, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import PublicDesktopNavigation from './PublicDesktopNavigation';

/* ── Page classification ─────────────────────────────────────────── */
const MAIN_PAGES = ['/home', '/info', '/aksi', '/profile', '/reports', '/pantau'];
const AUTH_PAGES = ['/login', '/register', '/register-community', '/forgot-password'];

// Navigasi bawah untuk versi mobile
const mobileNavItems = [
  { name: 'Beranda', path: '/home', icon: Home },
  { name: 'Info Cuaca', path: '/info', icon: CloudSun },
  { name: 'Aksi', path: '/aksi', icon: Flag },
  { name: 'Pantau', path: '/pantau', icon: ClipboardList }, // Disesuaikan dengan URL Next.js sebelumnya
  { name: 'Profil', path: '/profile', icon: User },
];

export function PublicLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const isMainPage = MAIN_PAGES.includes(pathname);
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isLandingPage = pathname === '/';
  const isChildPage = !isMainPage && !isAuthPage;

  function isNavActive(item) {
    if (item.matchPaths) return item.matchPaths.includes(pathname);
    return pathname === item.path;
  }

  // Jika di halaman Landing Page, kembalikan konten murni tanpa navbar
  if (isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ═══ HEADER ════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="flex h-14 w-full items-center justify-between px-4 lg:h-16">
          
          {/* Kelompok Kiri */}
          <div className="flex items-center gap-2">
            {/* Tombol kembali untuk halaman detail/anak */}
            {isChildPage && (
              <button 
                onClick={() => router.back()} 
                aria-label="Kembali" 
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-border"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            <Link href={isAuthPage ? "/" : "/home"} className="shrink-0">
              <Image 
                src="/logo.png" 
                alt="PARAS" 
                width={90} 
                height={32} 
                className="h-8 w-auto object-contain lg:h-10" 
                priority
              />
            </Link>
          </div>

          {/* Kelompok Kanan (Desktop) */}
          {!isAuthPage && (
            <PublicDesktopNavigation isMainPage={isMainPage} pathname={pathname} />
          )}
        </div>
      </header>

      {/* ═══ KONTEN HALAMAN ═══════════════════════════════════════════ */}
      {/* Memberikan padding bawah di versi mobile agar tidak tertutup bottom nav */}
      <main className={cn('flex-1 w-full', isMainPage && 'pb-20 lg:pb-0', isChildPage && 'pb-0')}>
        {children}
      </main>

      {/* ═══ FLOATING REPORT ASSISTANT (Tampil di main pages kecuali Beranda) ═══ */}
      {isMainPage && pathname !== '/home' && (
        <Link 
          href="/lapor" 
          aria-label="Lapor lewat Asisten PARAS" 
          className="group fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-[#E6008A] py-3 pl-3 pr-4 text-white shadow-lg shadow-pink-500/30 ring-4 ring-white transition-colors hover:bg-pink-600 focus-visible:outline-none focus-visible:ring-pink-500/40 lg:bottom-8 lg:right-8"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <MessageCircle className="h-5 w-5" aria-hidden />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#E6008A] bg-white" />
          </span>
          <span className="text-sm font-black">Lapor</span>
        </Link>
      )}

      {/* ═══ MOBILE BOTTOM NAV (Tampil hanya di main pages pada layar kecil) ════ */}
      {isMainPage && (
        <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-border bg-white lg:hidden pb-safe">
          {mobileNavItems.map((item) => {
            const active = isNavActive(item);
            
            // Logika untuk tombol aksi tengah (jika ada item dengan isAction: true)
            if (item.isAction) {
              return (
                <Link key={item.name} href={item.path} className="relative flex min-w-0 flex-1 flex-col items-center justify-center py-1.5" aria-label={item.name}>
                  <div className={cn('flex flex-col items-center justify-center w-14 h-14 rounded-full -mt-5 shadow-lg border-[3px] border-white transition-colors', active ? 'bg-pink-700' : 'bg-[#E6008A]')}>
                    <item.icon className="h-5 w-5 text-white" />
                    <span className="mt-0.5 text-[9px] font-black leading-tight text-white">{item.name}</span>
                  </div>
                </Link>
              );
            }

            // Menu navigasi standar
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                className={cn('relative flex min-w-0 flex-1 flex-col items-center justify-center px-0.5 py-2 gap-1 transition-colors', active ? 'text-[#159038]' : 'text-muted-foreground hover:text-foreground')} 
                aria-label={item.name}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-center text-[10px] font-semibold leading-tight">{item.name}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#159038]" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}