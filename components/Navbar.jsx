'use client';

import { Suspense } from 'react';
import globalStyles from '../app/globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '../public/logo.svg';
import NotificationBell from '../components/NotificationBell';

const links = [
  { href: '/home', label: 'Beranda' },
  { href: '/info', label: 'Info Cuaca dan Bencana' },
  { href: '/aksi', label: 'Aksi' },
  { href: '/pantau', label: 'Pantau Lapor' },
  { href: '/profile', label: 'Profil' },
];

function NavbarContent() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/home" className="flex items-center">
          <Image src={logo} alt="Logo PARAS" width={60} height={24} className="object-contain" />
          <p className="ml-2 text-xl font-bold text-gray-800">Paras</p>
        </Link>
        <div className="flex items-center gap-2 lg:gap-6">
          {/* Daftar Menu Navigasi */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={cn('rounded-full px-4 py-2 text-sm font-bold transition-colors', isActive ? 'bg-[color-brand] text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
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

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-white border-b border-gray-100" />}>
      <NavbarContent />
    </Suspense>
  );
}
