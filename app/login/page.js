'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Phone, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { createClient } from '../../lib/supabase/client';
import { loginWithEmail, loginWithPhone } from './actions';
import logo from '@/public/logo.svg';

export default function Login() {
  const router = useRouter();
  const [method, setMethod] = useState('email');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error');
    if (err === 'google_not_registered') {
      setAuthError('Akun Google ini belum terdaftar. Silakan daftar dengan email terlebih dahulu.');
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setAuthError('');
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/home`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setAuthError(err.message || 'Gagal masuk dengan Google');
      setGoogleLoading(false);
    }
  };

  function validate() {
    const e = {};
    if (!form.identifier.trim()) e.identifier = method === 'email' ? 'Email wajib diisi' : 'Nomor HP wajib diisi';
    if (!form.password) e.password = 'Kata sandi wajib diisi';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setAuthError('');

    try {
      const result = method === 'phone' ? await loginWithPhone({ phone: form.identifier, password: form.password }) : await loginWithEmail({ email: form.identifier, password: form.password });

      if (result?.error) throw new Error(result.error);

      localStorage.setItem('paras-authenticated', 'true');
      router.push('/home');
      router.refresh();
    } catch (err) {
      setAuthError(err.message || 'Gagal masuk. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col lg:items-center lg:justify-center lg:bg-muted/30 lg:py-12">
      <div className="w-full max-w-md mx-auto lg:bg-white lg:rounded-3xl lg:shadow-lg lg:overflow-hidden">
        {/* Logo hero */}
        <div className="bg-gradient-to-b from-brand-xlight to-white px-6 pt-10 pb-8 flex flex-col items-center text-center">
          <img src={typeof logo === 'string' ? logo : logo.src} alt="PARAS" className="h-16 w-auto object-contain mb-5" />
          <h1 className="text-2xl font-black text-foreground">Masuk ke Akun Anda</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">Platform Perempuan untuk Aksi Iklim & Respons Bencana</p>
        </div>

        <div className="flex-1 px-6 pb-10 bg-white">
          {authError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-500 text-center font-semibold">{authError}</div>}

          {/* Tombol Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-2xl py-3.5 text-sm font-semibold text-foreground shadow-sm mb-6 hover:bg-muted transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Lanjutkan dengan Google
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">atau masuk dengan</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Method toggle */}
          <div className="flex bg-muted p-1 rounded-xl mb-5">
            {['email', 'phone'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethod(m);
                  setForm({ ...form, identifier: '' });
                  setErrors({});
                }}
                className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-colors', method === m ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground')}
              >
                {m === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                {m === 'email' ? 'Email' : 'No. HP'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">{method === 'email' ? 'Alamat Email' : 'Nomor HP'}</label>
              <div className="relative">
                {method === 'email' ? <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /> : <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder={method === 'email' ? 'mail@gmail.com' : '08xxxxxxxxxx'}
                  className={cn('w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors', errors.identifier ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}
                />
              </div>
              {errors.identifier && <p className="text-xs text-red-500 mt-1">{errors.identifier}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground">Kata Sandi</label>
                <Link href="/forgot-password" className="text-xs text-pink font-bold">
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={cn('w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-colors', errors.password ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="text-brand font-black">
                Daftar Akun
              </Link>
            </p>
            <div className="pt-4 border-t border-border">
              <Link href="/admin/login" className="block text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                Login sebagai Admin / PKK Manager →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
