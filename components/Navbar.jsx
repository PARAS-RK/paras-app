'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/home', label: 'Beranda' },
  { href: '/info', label: 'Info Cuaca dan Bencana' },
  { href: '/aksi', label: 'Aksi' },
  { href: '/pantau', label: 'Pantau Lapor' },
  { href: '/profile', label: 'Profil' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/home" className="flex items-center">
          <Image src="/logo_paras_1.png" alt="Logo PARAS" width={80} height={32} className="object-contain" />
        </Link>
        <div className="flex items-center gap-2 lg:gap-6">
          {/* Daftar Menu Navigasi */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                    isActive
                      ? 'bg-[#159038] text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Tombol Notifikasi */}
          <button className="relative ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#E6008A] text-[9px] font-bold text-white">3</span>
          </button>
        </div>
      </div>
    </header>
  );
}
