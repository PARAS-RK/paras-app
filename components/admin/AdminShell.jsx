'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Bot, LogOut, Menu, X, ShieldCheck, ChevronRight, Leaf, Search, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import logo from '@/public/logo.svg';
import AdminNotifications from './AdminNotifications';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Manajemen Aksi', path: '/admin/actions', icon: Leaf },
  { name: 'Manajemen Pengguna', path: '/admin/manajemen-pengguna', icon: Users },
  { name: 'Asisten AI', path: '/admin/ai-assistant', icon: Bot },
  { name: 'Profil', path: '/admin/profile', icon: UserRound },
];

function isActive(item, pathname) {
  return item.exact ? pathname === item.path : pathname.startsWith(item.path);
}

function Sidebar({ mobile = false, pathname, onNavigate, onClose }) {
  const admin = useAdmin();

  return (
    <aside className={cn('flex flex-col border-r border-slate-800 bg-slate-950', mobile ? 'w-72' : 'sticky top-0 hidden h-screen w-64 lg:flex')}>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-white px-2 py-1">
            <Image src={logo} alt="PARAS" priority style={{ width: 'auto' }} className="h-6 object-contain" />
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            <span className="text-sm font-black tracking-tight text-white">Admin</span>
          </div>
        </div>
        {mobile && (
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4" aria-label="Menu admin">
        {navItems.map((item) => {
          const active = isActive(item, pathname);
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn('relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors', active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white')}
            >
              {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" />}
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.name}</span>
              {!active && <ChevronRight className="h-3.5 w-3.5 opacity-30" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer sidebar */}
      <div className="shrink-0 space-y-2 border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 px-2 py-1.5">
<<<<<<< HEAD
          <AdminAvatar className="h-8 w-8 text-xs" />
=======
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-white">{admin.initials}</div>
>>>>>>> 34c655e (feat: faq chatbot tanya paras)
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{admin.name}</p>
            <p className="truncate text-xs text-slate-500">{admin.email}</p>
          </div>
        </div>

        <form action="/auth/signout" method="post">
<<<<<<< HEAD
          <input type="hidden" name="next" value="/login" />
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-red-950 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
        </form>      
=======
          <input type="hidden" name="next" value="/admin/login" />
          <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-red-950 hover:text-red-400">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </form>
>>>>>>> 34c655e (feat: faq chatbot tanya paras)
      </div>
    </aside>
  );
}

export default function AdminShell({ children }) {
  const admin = useAdmin();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <Sidebar pathname={pathname} />

      {/* Drawer mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile pathname={pathname} onNavigate={() => setSidebarOpen(false)} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Area utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:h-16 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-slate-100 lg:hidden" aria-label="Buka menu">
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <Link href="/admin" className="shrink-0 lg:hidden">
              <Image src={logo} alt="PARAS" style={{ width: 'auto' }} className="h-7 object-contain" />
            </Link>
            <div className="hidden w-80 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10 md:flex">
              <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
              <input type="search" placeholder="Cari laporan, warga, atau wilayah..." aria-label="Cari laporan, warga, atau wilayah" className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminNotifications />

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <AdminAvatar className="h-8 w-8 text-xs" />
              <div className="hidden xl:block">
                <p className="text-xs font-black text-slate-800">{admin.name}</p>
                <p className="text-xs text-slate-400">Ketua PKK {admin.areaLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
