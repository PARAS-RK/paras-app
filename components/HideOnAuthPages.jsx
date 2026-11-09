'use client';

import { usePathname } from 'next/navigation';

const HIDDEN_PREFIXES = ['/daftar', '/admin/login'];

export default function HideOnAuthPages({ children }) {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  return hidden ? null : children;
}