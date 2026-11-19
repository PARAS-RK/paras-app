'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/public/logo.svg';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-black text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <>
          <ShieldCheck className="h-4 w-4" /> Masuk ke Admin Zone
        </>
      )}
    </button>
  );
}

export default function AdminLoginForm({ action, error }) {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  // Validasi sederhana di browser. Pengecekan akun yang sebenarnya di server (actions.js).
  function handleSubmit(ev) {
    const e = {};
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    if (!form.password) e.password = 'Kata sandi wajib diisi';
    setErrors(e);
    if (Object.keys(e).length) ev.preventDefault();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Portal Publik
        </Link>

        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="rounded-xl bg-white px-3 py-1.5">
              <Image src={logo} alt="PARAS" priority style={{ width: 'auto' }} className="h-9 object-contain" />
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <span className="text-lg font-black tracking-tight text-white">Admin Zone</span>
            </div>
          </div>
          <h1 className="mb-1 text-2xl font-black text-white">Masuk sebagai Admin</h1>
          <p className="text-sm text-slate-400">Khusus Ketua PKK</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form action={action} onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-300">
                Email Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Masukkan email Anda"
                  className={cn('w-full rounded-xl border bg-slate-800 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600', errors.email ? 'border-red-500' : 'border-slate-700 focus:border-brand')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-300">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-xl border bg-slate-800 py-3 pl-10 pr-11 text-sm text-white outline-none transition-colors placeholder:text-slate-600',
                    errors.password ? 'border-red-500' : 'border-slate-700 focus:border-brand',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <SubmitButton />
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">PARAS Admin Portal · Akses terbatas untuk personel terotorisasi</p>
      </div>
    </div>
  );
}
