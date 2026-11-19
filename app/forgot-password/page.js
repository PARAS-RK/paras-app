'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '../../public/logo.svg';
import { requestPasswordReset } from './action';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // /auth/confirm mengirim kembali ke sini (?error=link) jika tautan tidak valid / kedaluwarsa
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'link') {
      setError('Tautan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.');
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendLink() {
    const res = await requestPasswordReset(email);
    if (!res.success) {
      setError(res.error || 'Gagal mengirim email reset kata sandi.');
      return false;
    }
    setCooldown(60);
    return true;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();

    if (!email.trim()) return setError('Email wajib diisi');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Format email tidak valid');

    setError('');
    setLoading(true);
    try {
      if (await sendLink()) setSent(true);
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError('');
    try {
      await sendLink();
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col lg:items-center lg:justify-center lg:bg-muted/30 lg:py-12">
      <div className="w-full max-w-md mx-auto lg:bg-white lg:rounded-3xl lg:shadow-lg lg:overflow-hidden">
        <div className="bg-gradient-to-b from-brand-xlight to-white px-6 pt-10 pb-8 flex flex-col items-center text-center">
          <Image src={logo} alt="PARAS" className="h-16 w-auto object-contain mb-5" priority />
          <h1 className="text-2xl font-black text-foreground">Lupa Kata Sandi</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">Masukkan email yang Anda gunakan saat mendaftar. Kami akan mengirim tautan untuk membuat kata sandi baru.</p>
        </div>

        <div className="flex-1 px-6 pb-10 bg-white">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
                <CheckCircle2 className="h-7 w-7 text-brand" />
              </div>
              <p className="text-base font-black text-foreground">Cek email Anda</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Jika <span className="font-bold text-foreground">{email.trim()}</span> terdaftar di PARAS, tautan reset kata sandi sudah dikirim. Periksa juga folder Spam atau Promosi.
              </p>
              {error && (
                <p role="alert" className="mt-3 text-xs text-red-500">
                  {error}
                </p>
              )}
              <button type="button" onClick={handleResend} disabled={cooldown > 0} className="mt-5 text-sm font-bold text-pink disabled:opacity-60">
                {cooldown > 0 ? `Kirim ulang tautan (${cooldown}s)` : 'Kirim ulang tautan'}
              </button>
              {/* <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError('');
                }}
                className="mt-3 block w-full text-xs text-muted-foreground underline"
              >
                Gunakan email lain
              </button> */}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-foreground mb-1.5">
                  Email Terdaftar
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@example.com"
                    className={cn('w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors', error ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}
                  />
                </div>
                {error && (
                  <p role="alert" className="text-xs text-red-500 mt-1">
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Tautan Reset'}
              </button>
            </form>
          )}

          <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-black text-brand">
            <ArrowLeft className="w-4 h-4" /> Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
