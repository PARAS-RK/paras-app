"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/public/logo_paras_1.png';
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    function handleSubmit(ev) {
        ev.preventDefault();
        if (!email.trim()) {
            setError('Email wajib diisi');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError('Format email tidak valid');
            return;
        }
        setError('');
        setLoading(true);
        setTimeout(() => { setLoading(false); setSent(true); }, 700);
    }
    return (<div className="min-h-[calc(100vh-64px)] flex flex-col lg:items-center lg:justify-center lg:bg-muted/30 lg:py-12">
      <div className="w-full max-w-md mx-auto lg:bg-white lg:rounded-3xl lg:shadow-lg lg:overflow-hidden">
        <div className="bg-gradient-to-b from-brand-xlight to-white px-6 pt-10 pb-8 flex flex-col items-center text-center">
          <img src={logo.src || logo} alt="PARAS" className="h-16 w-auto object-contain mb-5"/>
          <h1 className="text-2xl font-black text-foreground">Lupa Kata Sandi</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
            Masukkan email yang Anda gunakan saat mendaftar. Kami akan mengirim tautan untuk membuat kata sandi baru.
          </p>
        </div>

        <div className="flex-1 px-6 pb-10 bg-white">
          {sent ? (<div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
                <CheckCircle2 className="h-7 w-7 text-brand"/>
              </div>
              <p className="text-base font-black text-foreground">Cek email Anda</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Jika <span className="font-bold text-foreground">{email.trim()}</span> terdaftar di PARAS, tautan reset kata sandi sudah dikirim. Periksa juga folder Spam atau Promosi.
              </p>
              <button type="button" onClick={() => setSent(false)} className="mt-5 text-sm font-bold text-pink">
                Kirim ulang ke email lain
              </button>
            </div>) : (<form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-foreground mb-1.5">Email Terdaftar</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                  <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ibu.sari@email.com" className={cn('w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors', error ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}/>
                </div>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                : 'Kirim Tautan Reset'}
              </button>
            </form>)}

          <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-black text-brand">
            <ArrowLeft className="w-4 h-4"/> Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </div>);
}
