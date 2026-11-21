'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Home, CloudSun, Flag, ClipboardList, User } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '../public/logo.svg';
import NotificationBell from './NotificationBell';

const links = [
  { href: '/home', label: 'Beranda', icon: Home },
  { href: '/info', label: 'Info Cuaca dan Bencana', icon: CloudSun },
  { href: '/aksi', label: 'Aksi', icon: Flag },
  { href: '/pantau', label: 'Pantau Lapor', icon: ClipboardList },
  { href: '/profile', label: 'Profil', icon: User },
];

function NavbarContent() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/home" className="flex items-center">
          <Image src={logo} alt="Logo PARAS" priority className="h-6 w-auto object-contain" />
          <p className="ml-2 text-xl font-bold text-gray-800">Paras</p>
        </Link>
        <div className="flex items-center gap-2 lg:gap-6">
          {/* Daftar Menu Navigasi */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href} className={cn('rounded-full px-4 py-2 text-sm font-bold transition-colors', isActive ? 'bg-brand-light text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {/* Tombol Notifikasi */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn('flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] font-medium leading-tight transition-colors', isActive ? 'text-green-700' : 'text-gray-500 hover:text-gray-800')}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-white border-b border-gray-100" />}>
      <NavbarContent />
      <BottomNav />
    </Suspense>
  );
}
