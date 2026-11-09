'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export default function FloatingLaporButton() {
  const pathname = usePathname();

  // Matikan (jangan render) tombol jika pengguna berada di route '/' atau '/home'
  if (pathname === '/' || pathname === '/home') {
    return null;
  }

  return (
    <Link href="/lapor" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#E6008A] px-6 py-4 font-bold text-white shadow-lg shadow-pink-500/30 transition-transform hover:scale-105 hover:bg-pink-600">
      <MessageCircle className="h-5 w-5" />
      Lapor
    </Link>
  );
}
