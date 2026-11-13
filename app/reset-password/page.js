'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function ResetPassword() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Valid hanya jika /auth/confirm sudah memverifikasi tautan email dan membuat sesi
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setStatus(user ? 'ready' : 'invalid');
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (password.length < 8) return setError('Kata sandi minimal 8 karakter');
    if (password !== confirm) return setError('Konfirmasi kata sandi tidak sama');

    setError('');
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      document.cookie = 'pw_recovery=; Max-Age=0; path=/';
      await supabase.auth.signOut();
      setStatus('done');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      console.error('Gagal mengganti kata sandi:', err);
      const same = /different from the old/i.test(err.message || '');
      setError(same ? 'Kata sandi baru harus berbeda dari yang lama.' : err.message || 'Gagal mengganti kata sandi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError) => cn('w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-colors', hasError ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white');

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col lg:items-center lg:justify-center lg:bg-muted/30 lg:py-12">
      <div className="w-full max-w-md mx-auto lg:bg-white lg:rounded-3xl lg:shadow-lg lg:overflow-hidden">
        <div className="bg-gradient-to-b from-brand-xlight to-white px-6 pt-10 pb-8 text-center">
          <h1 className="text-2xl font-black text-foreground">Buat Kata Sandi Baru</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">Masukkan kata sandi baru untuk akun PARAS Anda.</p>
        </div>

        <div className="px-6 pb-10 bg-white">
          {status === 'checking' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center">
              <p className="text-base font-black text-foreground">Tautan tidak valid atau kedaluwarsa</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">Minta tautan reset baru, lalu buka tautan dari email terbaru Anda.</p>
              <Link href="/forgot-password" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-black text-white">
                Minta Tautan Baru
              </Link>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
                <CheckCircle2 className="h-7 w-7 text-brand" />
              </div>
              <p className="text-base font-black text-foreground">Kata sandi berhasil diganti</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Mengarahkan ke halaman masuk...</p>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-xs font-bold text-foreground mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input id="new-password" type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" className={inputClass(!!error)} />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold text-foreground mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirm-password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className={inputClass(!!error)}
                  />
                </div>
                {error && (
                  <p role="alert" className="text-xs text-red-500 mt-1">
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Kata Sandi'}
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
