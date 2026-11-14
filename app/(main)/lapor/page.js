'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send, Paperclip, X, CheckCircle2, FileText,
  Image as ImageIcon, ArrowRight, MessageCircle,
  MapPin, Lock, Loader2, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LAPOR_LIMITS, validateFile, validateReportFields } from '@/lib/lapor-validation';

const LOGIN_PATH = '/login';
const PROFILE_PATH = '/profil';

const WELCOME_MESSAGE = {
  role: 'bot',
  text: 'Halo! Selamat datang di PARAS. Saya PARA, asisten digital Anda. Ada yang bisa saya bantu hari ini?',
};

const FIELD_BASE = 'w-full text-sm rounded-xl border px-3 py-2.5 outline-none transition-colors bg-muted/30 focus:bg-white';
const fieldClass = (hasError) => cn(FIELD_BASE, hasError ? 'border-red-400' : 'border-border focus:border-[#159038]');

const formatMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function Lapor() {
  const router = useRouter();
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const [step, setStep] = useState('welcome'); // welcome | form | submitted
  const [boot, setBoot] = useState({ status: 'loading', message: '' }); // loading | ready | error
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [form, setForm] = useState({ category: '', location: '', details: '', file: null, isAnonymous: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/lapor', { signal: controller.signal, cache: 'no-store' });
        if (res.status === 401) {
          router.replace(`${LOGIN_PATH}?next=/lapor`);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Gagal memuat data pelapor');

        setProfile(data.profile);
        setCategories(data.categories);
        setForm((prev) => ({ ...prev, isAnonymous: data.profile.hideName }));
        setBoot({ status: 'ready', message: '' });
      } catch (err) {
        if (err.name === 'AbortError') return;
        setBoot({ status: 'error', message: err.message || 'Gagal memuat data pelapor' });
      }
    })();

    return () => controller.abort();
  }, [router]);

  // Gulir otomatis ke bawah saat ada pesan/langkah baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, step]);

  function addMsg(role, text) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleChoose() {
    addMsg('user', 'Saya ingin membuat laporan');
    setTimeout(() => {
      addMsg('bot', `Baik! Laporan akan dibuat untuk wilayah Anda, ${profile.areaLabel}. Isi formulir di bawah ini, termasuk detail lokasi kejadiannya.`);
      setStep('form');
    }, 400);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;

    const fileError = validateFile(file);
    if (fileError) {
      setErrors((prev) => ({ ...prev, file: fileError }));
      return;
    }
    updateField('file', file);
  }

  async function handleSubmit() {
    if (submitting) return;

    const found = validateReportFields(form);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);

    try {
      const body = new FormData();
      body.append('category', form.category);
      body.append('location', form.location.trim());
      body.append('details', form.details.trim());
      body.append('isAnonymous', String(form.isAnonymous));
      body.append('file', form.file);

      const res = await fetch('/api/lapor', { method: 'POST', body });

      if (res.status === 401) {
        router.replace(`${LOGIN_PATH}?next=/lapor`);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setSubmitError(res.status === 413 ? 'Ukuran file terlalu besar. Pilih file yang lebih kecil.' : data.error || 'Laporan gagal dikirim. Silakan coba lagi.');
        setSubmitting(false);
        return;
      }

      const preview = form.details.trim();
      addMsg('user', `Laporan dikirim (📍 ${form.location.trim()}): "${preview.slice(0, 60)}${preview.length > 60 ? '...' : ''}"`);
      setResult({ ticketCode: data.ticketCode });
      setStep('submitted');
    } catch {
      setSubmitError('Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.');
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------------ states
  if (boot.status === 'loading') {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center" role="status" aria-label="Memuat">
        <Loader2 className="h-8 w-8 animate-spin text-[#159038]" />
      </div>
    );
  }

  if (boot.status === 'error') {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" aria-hidden />
        <p className="text-sm text-foreground max-w-xs">{boot.message}</p>
        <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-[#159038] px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors">
          Muat ulang
        </button>
      </div>
    );
  }

  const noRegion = !profile.hasRegion;

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100dvh-72px)] max-w-2xl mx-auto w-full bg-gray-50/50">
      {/* Bot header */}
      <div className="bg-white px-4 py-3 border-b border-border flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-[#E6008A] flex items-center justify-center shrink-0">
          <MessageCircle className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <p className="font-black text-foreground text-sm">PARA — Asisten PARAS</p>
          <p className="text-[10px] text-[#159038] flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#159038] inline-block" /> Online
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-[#E6008A] flex items-center justify-center mr-2 mt-1 shrink-0">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line break-words',
                msg.role === 'bot' ? 'bg-white border border-border text-foreground shadow-sm rounded-tl-none' : 'bg-[#159038] text-white rounded-tr-none shadow-sm',
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Tombol pilihan */}
        {step === 'welcome' && (
          <div className="flex flex-col gap-2 pl-9">
            {noRegion && (
              <div className="max-w-[78%] rounded-2xl rounded-tl-none border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                Wilayah pada profil Anda belum diisi, sehingga laporan belum bisa dibuat.{' '}
                <Link href={PROFILE_PATH} className="font-bold underline">
                  Lengkapi profil
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={handleChoose}
              disabled={noRegion}
              className="flex items-center gap-2 bg-[#159038] hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white rounded-2xl rounded-tl-none px-4 py-3 text-sm font-bold w-fit shadow-sm"
            >
              <FileText className="w-4 h-4" /> Buat Laporan
            </button>
          </div>
        )}

        {/* Formulir */}
        {step === 'form' && (
          <div className="pl-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl rounded-tl-none border border-border shadow-sm p-5 space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Formulir Laporan</p>

              {/* Nama pelapor (dari profil, tidak bisa diubah) */}
              <div>
                <label htmlFor="reporter" className="block text-xs font-bold text-foreground mb-1.5">
                  Nama Pelapor
                </label>
                <div className="relative">
                  <input
                    id="reporter"
                    type="text"
                    value={profile.displayName}
                    readOnly
                    aria-readonly="true"
                    className="w-full text-sm font-semibold rounded-xl border border-border px-3 py-2.5 pr-9 bg-muted/60 text-muted-foreground cursor-not-allowed outline-none"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.isAnonymous} onChange={(e) => updateField('isAnonymous', e.target.checked)} className="h-4 w-4 rounded border-border accent-[#159038]" />
                  Sembunyikan nama saya dari tampilan publik
                </label>
              </div>

              {/* Kategori */}
              <div>
                <label htmlFor="category" className="block text-xs font-bold text-foreground mb-1.5">
                  Kategori Laporan *
                </label>
                <select id="category" value={form.category} onChange={(e) => updateField('category', e.target.value)} aria-invalid={Boolean(errors.category)} className={fieldClass(errors.category)}>
                  <option value="">Pilih kategori…</option>
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1 font-medium">{errors.category}</p>}
              </div>

              {/* Lokasi */}
              <fieldset>
                <legend className="block text-xs font-bold text-foreground mb-1.5">Lokasi Kejadian *</legend>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2.5">
                  <MapPin className="w-4 h-4 text-[#159038] shrink-0" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-foreground">{profile.areaFull}</span>
                  <Lock className="w-4 h-4 text-muted-foreground" aria-hidden />
                </div>
                <label htmlFor="loc" className="sr-only">
                  Detail lokasi
                </label>
                <input
                  id="loc"
                  type="text"
                  value={form.location}
                  maxLength={LAPOR_LIMITS.locationMax}
                  onChange={(e) => updateField('location', e.target.value)}
                  aria-invalid={Boolean(errors.location)}
                  placeholder="Mis. Jl. Melati, RT 02 / RW 05, depan musala"
                  className={cn('mt-2', fieldClass(errors.location))}
                />
                {errors.location ? <p className="text-xs text-red-500 mt-1 font-medium">{errors.location}</p> : <p className="text-[10px] text-muted-foreground mt-1">Sebutkan nama jalan, RT/RW, atau patokan.</p>}
              </fieldset>

              {/* Uraian */}
              <div>
                <label htmlFor="details" className="block text-xs font-bold text-foreground mb-1.5">
                  Uraian Laporan *
                </label>
                <textarea
                  id="details"
                  value={form.details}
                  maxLength={LAPOR_LIMITS.detailsMax}
                  onChange={(e) => updateField('details', e.target.value)}
                  aria-invalid={Boolean(errors.details)}
                  placeholder="Ceritakan situasi yang Anda alami atau lihat..."
                  rows={4}
                  className={cn('resize-none', fieldClass(errors.details))}
                />
                {errors.details && <p className="text-xs text-red-500 mt-1 font-medium">{errors.details}</p>}
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {form.details.length}/{LAPOR_LIMITS.detailsMax} karakter
                </p>
              </div>

              {/* Bukti */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Bukti Foto *</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                {form.file ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <ImageIcon className="w-4 h-4 text-[#159038] shrink-0" />
                    <span className="text-xs text-[#159038] font-semibold flex-1 truncate">{form.file.name}</span>
                    <span className="text-[10px] text-[#159038]/70 shrink-0">{formatMB(form.file.size)}</span>
                    <button type="button" onClick={() => updateField('file', null)} aria-label="Hapus lampiran" className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      'flex items-center gap-2 text-sm text-muted-foreground border border-dashed rounded-xl px-4 py-3 w-full transition-colors',
                      errors.file ? 'border-red-400 bg-red-50/50' : 'border-border hover:border-[#159038] hover:text-[#159038] hover:bg-green-50/50',
                    )}
                  >
                    <Paperclip className="w-4 h-4" />
                    Lampirkan foto (JPG, PNG, WebP · maks {LAPOR_LIMITS.maxFileBytes / 1024 / 1024}MB)
                  </button>
                )}
                {errors.file && <p className="text-xs text-red-500 mt-1 font-medium">{errors.file}</p>}
              </div>

              {submitError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" aria-hidden />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#159038] hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengirim…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Kirim Laporan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Berhasil */}
        {step === 'submitted' && result && (
          <div className="pl-9 animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-2xl rounded-tl-none border border-green-100 shadow-sm p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
                <CheckCircle2 className="w-8 h-8 text-[#159038]" />
              </div>
              <h3 className="font-black text-foreground text-lg mb-1">Laporan Terkirim!</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Nomor laporan: <span className="font-black text-[#E6008A]">{result.ticketCode}</span>
              </p>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-xs mx-auto">Laporan Anda sedang diproses. Kami akan merespons dalam 1×24 jam melalui sistem PARAS.</p>
              <Link href="/pantau" className="inline-flex items-center gap-2 bg-[#E6008A] hover:bg-pink-600 text-white rounded-full px-6 py-3 text-sm font-bold transition-all hover:shadow-lg hover:shadow-pink-500/30">
                Pantau Status Laporan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input placeholder saat di welcome */}
      {step === 'welcome' && (
        <div className="bg-white border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 bg-gray-100/50 border border-border rounded-xl px-3 py-2.5">
            <input type="text" disabled placeholder="Gunakan tombol di atas untuk merespons..." className="flex-1 text-sm text-gray-400 bg-transparent outline-none cursor-not-allowed" />
            <Send className="w-4 h-4 text-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
}
