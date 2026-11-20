'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Eye, EyeOff, LoaderCircle, Lock, Mail, MessageCircle, Phone, User, XCircle } from 'lucide-react';

import { contactFor, formatRemaining } from '../../lib/memberStore';
import { cn } from '../../lib/utils';
import logo from '@/public/logo.svg';
import { createClient } from '../../lib/supabase/client';
import RegionPicker from '@/components/RegionPicker';

const PKK_TABLE = 'pkk_units';
const REGION_TABLE = 'regions';

// Ubah 0815xxxx / +62815xxxx -> 62815xxxx untuk tautan wa.me
function toWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

// Ambil status pendaftaran pengguna yang sedang login dari tabel profiles
async function fetchRegistration(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase.from('profiles').select('full_name, account_category, account_status, status_reason, created_at, regions(subdistrict)').eq('user_id', user.id).maybeSingle();
  if (error || !profile) {
    if (error) console.error('Gagal memuat profil:', error);
    return null;
  }

  const { data: contactData } = await supabase.rpc('my_pkk_contact');
  const c = Array.isArray(contactData) ? contactData[0] : contactData;
  const contact = c?.leader_name && c?.leader_phone ? { name: c.leader_name, role: `Ketua ${c.unit_name}`, phone: c.leader_phone, wa: toWhatsAppNumber(c.leader_phone) } : null;

  const statusMap = { active: 'approved', pending: 'pending', rejected: 'rejected', suspended: 'rejected' };
  const fallbackReason = profile.account_status === 'suspended' ? 'Akun Anda sedang ditangguhkan.' : 'Pendaftaran Anda belum dapat disetujui.';

  return {
    id: user.id,
    name: profile.full_name,
    email: user.email,
    type: profile.account_category === 'anggota_pkk' ? 'pkk' : 'general',
    kelurahan: profile.regions?.subdistrict ?? '',
    status: statusMap[profile.account_status] ?? 'pending',
    rejectReason: profile.status_reason || fallbackReason,
    submittedAt: new Date(profile.created_at).getTime(),
    contact,
  };
}

export default function Register() {
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState('form');
  const [accountType, setAccountType] = useState('general');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    provinceCode: '',
    provinceName: '',
    cityCode: '',
    cityName: '',
    districtCode: '',
    districtName: '',
    subdistrictCode: '',
    subdistrictName: '',
  });

  const [errors, setErrors] = useState({});
  const [registration, setRegistration] = useState(null);
  const [sessionUser, setSessionUser] = useState(null); // pengguna yang SUDAH aktif & sedang login

  // State alur OTP
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpInfo, setOtpInfo] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Jika pengguna sudah punya sesi (mis. refresh halaman), tampilkan status pendaftarannya
  useEffect(() => {
    let cancelled = false;
    fetchRegistration(supabase).then((reg) => {
      if (cancelled || !reg) return;
      if (reg.status === 'approved') {
        // Jangan redirect otomatis ke '/': jika beranda mengarahkan balik ke /register
        // akan terjadi loop. Tampilkan info + pilihan untuk keluar.
        setSessionUser(reg);
        return;
      }
      setRegistration(reg);
      setStep('done');
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Selama menunggu, cek status ke database tiap 20 detik
  useEffect(() => {
    if (step !== 'done' || registration?.status !== 'pending') return;
    const t = setInterval(async () => {
      const reg = await fetchRegistration(supabase);
      if (reg) setRegistration(reg);
    }, 20000);
    return () => clearInterval(t);
  }, [step, registration?.status, supabase]);

  // Hitung mundur tombol "Kirim ulang"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // --- Validasi komunitas PKK (hook harus di dalam komponen) ---
  const locationComplete = Boolean(form.subdistrictCode);
  // Semua jenis akun (anggota PKK maupun warga umum) butuh komunitas PKK terdaftar di kelurahannya
  const needsPkkCheck = locationComplete;
  const pkkKey = form.subdistrictCode;
  const [pkkResult, setPkkResult] = useState({ key: '', active: false });

  const isCheckingPkk = needsPkkCheck && pkkResult.key !== pkkKey;
  const isPkkActive = !needsPkkCheck || (pkkResult.key === pkkKey && pkkResult.active);
  const pkkActive = needsPkkCheck && !isCheckingPkk && isPkkActive;
  const pkkBlocked = needsPkkCheck && !isCheckingPkk && !isPkkActive;

  useEffect(() => {
    if (!needsPkkCheck) return;
    let cancelled = false;

    async function checkPkkCommunity() {
      // !inner = hanya ambil pkk_units yang region-nya cocok dengan kode kelurahan (format 11.01.01.2001)
      const { data, error } = await supabase.from(PKK_TABLE).select(`pkk_unit_id, ${REGION_TABLE}!inner(subdistrict_code)`).eq(`${REGION_TABLE}.subdistrict_code`, form.subdistrictCode).limit(1);

      if (cancelled) return;
      if (error) console.error('Gagal cek komunitas PKK:', error);
      setPkkResult({ key: pkkKey, active: Boolean(data?.length) });
    }

    checkPkkCommunity();
    return () => {
      cancelled = true;
    };
  }, [needsPkkCheck, pkkKey, form.subdistrictCode, supabase]);

  // Dipanggil RegionPicker setiap pilihan wilayah berubah
  function handleRegionChange(patch) {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((er) => ({ ...er, province: '', city: '', district: '', subdistrict: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi';
    if (!form.password || form.password.length < 8) e.password = 'Kata sandi minimal 8 karakter';
    if (!form.provinceCode) e.province = 'Pilih provinsi';
    if (!form.cityCode) e.city = 'Pilih kota/kabupaten';
    if (!form.districtCode) e.district = 'Pilih kecamatan';
    if (!form.subdistrictCode) e.subdistrict = 'Pilih kelurahan';
    else if (!isPkkActive) e.subdistrict = 'Komunitas PKK di kelurahan ini belum terdaftar';
    return e;
  }

  // Langkah 1: daftar -> Supabase mengirim email berisi kode OTP
  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          // Disimpan di user_metadata (bisa dipakai trigger untuk membuat profil)
          data: {
            full_name: form.name.trim(),
            phone: form.phone.trim(),
            account_type: accountType,
            province: form.provinceName,
            city: form.cityName,
            kecamatan: form.districtName,
            kelurahan: form.subdistrictName,
            subdistrict_code: form.subdistrictCode,
          },
        },
      });

      if (error) throw error;

      // Email sudah terdaftar & terverifikasi: Supabase tidak error, tapi identities kosong
      if (data.user && data.user.identities?.length === 0) {
        setFormError('Email ini sudah terdaftar. Silakan masuk.');
        return;
      }

      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setResendCooldown(60);
      setStep('otp');
    } catch (err) {
      console.error('Gagal mendaftar:', err);
      const generic = String(err.message || '').includes('Database error saving new user');
      setFormError(generic ? 'Pendaftaran gagal. Pastikan komunitas PKK di kelurahan Anda sudah terdaftar dan data sudah benar.' : err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Langkah 2: verifikasi kode yang diketik pengguna
  async function handleVerifyOtp() {
    const token = otp.join('');
    if (token.length < 6) return;

    setOtpError('');
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: form.email.trim(),
        token,
        type: 'email',
      });
      if (error) throw error;

      // Profil dibuat otomatis oleh trigger di database saat signUp
      const reg = await fetchRegistration(supabase);
      setRegistration(
        reg ?? {
          id: data.user?.id ?? null,
          name: form.name.trim(),
          email: form.email.trim(),
          type: accountType,
          kelurahan: form.subdistrictName,
          status: 'pending',
          submittedAt: Date.now(),
        },
      );
      setStep('done');
    } catch (err) {
      console.error('Verifikasi OTP gagal:', err);
      setOtpError('Kode salah atau sudah kedaluwarsa. Coba lagi atau kirim ulang kode.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setOtpError('');
    setOtpInfo('');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: form.email.trim(),
    });
    if (error) {
      console.error('Gagal kirim ulang:', error);
      setOtpError(error.message || 'Gagal mengirim ulang kode.');
      return;
    }
    setResendCooldown(60);
    setOtpInfo('Kode verifikasi baru telah dikirim ke email Anda.');
  }

  function handleOtpChange(i, val) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((c, idx) => (next[idx] = c));
    setOtp(next);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSessionUser(null);
    setRegistration(null);
    setStep('form');
  }

  // Pengguna sudah aktif & login: jangan tampilkan form daftar / redirect berulang
  if (sessionUser && step === 'form') {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 text-center">
        <h2 className="text-foreground mb-2 text-xl font-black">Anda sudah masuk</h2>
        <p className="text-muted-foreground mb-6 max-w-xs text-sm leading-relaxed">
          Akun <span className="text-foreground font-bold">{sessionUser.name}</span> sudah aktif. Untuk mendaftarkan akun baru, keluar dulu dari akun ini.
        </p>
        <div className="w-full max-w-sm space-y-3">
          <Link href="/" className="bg-brand block w-full rounded-xl py-3.5 text-center text-sm font-black text-white">
            Ke Beranda
          </Link>
          <button type="button" onClick={handleSignOut} className="border-brand-light text-brand hover:bg-brand-xlight block w-full rounded-xl border-2 py-3 text-sm font-bold">
            Keluar & daftar akun baru
          </button>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 pb-10">
        <div className="bg-brand-light mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Mail className="text-brand h-8 w-8" />
        </div>
        <h2 className="text-foreground mb-2 text-center text-2xl font-black">Verifikasi Email</h2>
        <p className="text-muted-foreground mb-8 text-center text-sm leading-relaxed">
          Masukkan kode 6 digit yang kami kirim ke <span className="text-foreground font-bold">{form.email}</span>
        </p>
        <div className="mb-4 flex gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              onPaste={handleOtpPaste}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              className={cn('h-13 w-11 rounded-xl border-2 text-center text-lg font-black outline-none transition-colors', digit ? 'border-brand bg-brand-light text-brand' : 'bg-muted text-foreground border-border')}
            />
          ))}
        </div>
        {otpInfo && (
          <p role="status" className="text-brand-dark mb-4 max-w-xs text-center text-xs font-semibold">
            {otpInfo}
          </p>
        )}
        {otpError && (
          <p role="alert" className="mb-4 max-w-xs text-center text-xs text-red-500">
            {otpError}
          </p>
        )}
        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={otp.join('').length < 6 || isVerifying}
          className="bg-brand hover:bg-brand-dark mb-4 flex w-full max-w-sm items-center justify-center gap-2 rounded-xl py-3.5 font-black text-white transition-colors disabled:opacity-50"
        >
          {isVerifying && <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" />}
          {isVerifying ? 'Memverifikasi...' : 'Verifikasi'}
        </button>
        <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} className="text-muted-foreground text-sm disabled:opacity-60">
          Tidak menerima kode? <span className="text-pink font-bold">{resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim ulang'}</span>
        </button>
        <button type="button" onClick={() => setStep('form')} className="text-muted-foreground mt-3 text-xs underline">
          Ganti email
        </button>
      </div>
    );
  }

  if (step === 'done') {
    return <ApprovalPending reg={registration} firstName={form.name.split(' ')[0]} />;
  }

  return (
    <>
      <div className="lg:bg-muted/30 lg:flex lg:min-h-[calc(100vh-64px)] lg:items-start lg:justify-center lg:px-6 lg:py-12">
        <div className="mx-auto w-full max-w-lg lg:overflow-hidden lg:rounded-3xl lg:bg-white lg:shadow-lg">
          <div className="bg-gradient-to-b from-brand-xlight to-white flex flex-col items-center px-6 pt-8 pb-6 text-center">
            <Image src={logo} alt="PARAS" className="mb-5 h-16 w-auto object-contain" />
            <h1 className="text-foreground text-2xl font-black">Daftar Akun</h1>
            <p className="text-muted-foreground mt-1 max-w-xs text-sm">Untuk pengguna perorangan — warga umum maupun anggota PKK</p>
          </div>

          <div className="bg-white px-6 pb-10">
            {/* Account type */}
            <div className="mb-5">
              <p className="text-foreground mb-2 text-xs font-bold uppercase tracking-wider">Kategori Akun</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'general', label: 'Umum', desc: 'Warga & masyarakat', icon: '👤' },
                  {
                    val: 'pkk',
                    label: 'Anggota PKK',
                    desc: 'Bergabung lewat alamat kelurahan',
                    icon: '🤝',
                  },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => {
                      setAccountType(t.val);
                      setErrors((e) => ({ ...e, subdistrict: '' }));
                    }}
                    className={cn('rounded-2xl border-2 p-3.5 text-left transition-colors', accountType === t.val ? 'border-brand bg-brand-xlight' : 'border-border hover:bg-muted bg-white')}
                  >
                    <span className="mb-1.5 block text-xl">{t.icon}</span>
                    <span className={cn('block text-sm font-black', accountType === t.val ? 'text-brand' : 'text-foreground')}>{t.label}</span>
                    <span className="text-muted-foreground text-[10px]">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                {
                  name: 'name',
                  label: 'Nama Lengkap',
                  placeholder: 'Nama lengkap Anda',
                  type: 'text',
                  icon: User,
                },
                {
                  name: 'email',
                  label: 'Email',
                  placeholder: 'email@contoh.com',
                  type: 'email',
                  icon: Mail,
                },
                {
                  name: 'phone',
                  label: 'Nomor HP',
                  placeholder: '08xxxxxxxxxx',
                  type: 'tel',
                  icon: Phone,
                },
              ].map(({ name, label, placeholder, type, icon: Icon }) => (
                <div key={name}>
                  <label className="text-foreground mb-1.5 block text-xs font-bold">{label}</label>
                  <div className="relative">
                    <Icon className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                    <input
                      type={type}
                      value={form[name]}
                      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                      placeholder={placeholder}
                      className={cn('w-full rounded-xl border py-3 pr-4 pl-10 text-sm outline-none transition-colors', errors[name] ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}
                    />
                  </div>
                  {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
                </div>
              ))}

              <div>
                <label className="text-foreground mb-1.5 block text-xs font-bold">Kata Sandi</label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 8 karakter"
                    className={cn('w-full rounded-xl border py-3 pr-11 pl-10 text-sm outline-none transition-colors', errors.password ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-muted-foreground absolute top-1/2 right-3.5 -translate-y-1/2">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Dynamic Location Selectors */}
              <div className="border-border bg-muted/40 space-y-4 rounded-2xl border p-4">
                <p className="text-foreground text-xs font-bold uppercase tracking-wider">Lokasi Domisili</p>
                {accountType === 'pkk' && isPkkActive && <p className="text-muted-foreground -mt-2 text-xs leading-relaxed">Anda otomatis tergabung dengan komunitas PKK yang terdaftar di kelurahan yang sama.</p>}

                <RegionPicker
                  value={form}
                  onChange={handleRegionChange}
                  // Pesan "PKK belum terdaftar" sudah tampil di banner di bawah, jadi disembunyikan dari dropdown
                  errors={pkkBlocked ? { ...errors, subdistrict: undefined } : errors}
                  bgClass="bg-white"
                  focusClass="focus:border-brand"
                  showRequired={false}
                />

                {pkkActive && (
                  <div role="status" className="border-brand-light bg-brand-xlight flex items-start gap-2.5 rounded-xl border p-3">
                    <CheckCircle2 className="text-brand mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-brand-dark text-xs font-black">{accountType === 'pkk' ? 'Komunitas PKK Anda sudah aktif' : 'Komunitas PKK kelurahan ini sudah aktif'}</p>
                      <p className="text-brand-dark/80 mt-0.5 text-xs">PKK Kel. {form.subdistrictName} sudah terdaftar di PARAS. Silakan lanjutkan pendaftaran.</p>
                    </div>
                  </div>
                )}

                {pkkBlocked && (
                  <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-black text-amber-800">Komunitas PKK belum terdaftar</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                          PKK Kel. {form.subdistrictName} belum terdaftar di PARAS. Ketua PKK perlu mendaftarkan komunitasnya terlebih dahulu sebelum anggota maupun warga dapat membuat akun.
                        </p>
                      </div>
                    </div>
                    <Link href="/pkk/community" className="bg-pink hover:bg-pink-dark mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black text-white">
                      Daftarkan Komunitas PKK <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {formError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={pkkBlocked || isCheckingPkk || isSubmitting}
                className="bg-brand hover:bg-brand-dark mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /> Mengirim Kode OTP...
                  </>
                ) : (
                  <>
                    Daftar & Verifikasi Email <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-muted-foreground text-sm">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-brand font-black">
                  Masuk
                </Link>
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-[10px]">Daftarkan komunitas PKK?</span>
                <div className="bg-border h-px flex-1" />
              </div>
              <Link href="/pkk/community" className="border-pink text-pink hover:bg-pink-xlight block w-full rounded-xl border-2 py-3 text-sm font-black transition-colors">
                Daftar Komunitas PKK →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function useNow(interval = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

/* Waits for the PKK admin of the applicant's kelurahan to approve within 1x24 hours. */
function ApprovalPending({ reg, firstName }) {
  const now = useNow();

  if (!reg) return null;

  const contact = reg.contact ?? contactFor(reg.kelurahan);
  const remaining = reg.submittedAt + 24 * 60 * 60 * 1000 - now;
  const overdue = remaining <= 0;

  const ContactCard = ({ emphasis }) => (
    <div className={cn('w-full rounded-2xl border p-4 text-left', emphasis ? 'border-red-200 bg-red-50' : 'border-border bg-muted/40')}>
      <p className={cn('text-xs font-black', emphasis ? 'text-red-700' : 'text-foreground')}>{emphasis ? 'Sudah lebih dari 1x24 jam? Hubungi admin PKK Anda' : 'Lebih dari 1x24 jam? Hubungi admin PKK setempat'}</p>
      <p className="text-foreground mt-1 text-sm font-bold">{contact.name}</p>
      <p className="text-muted-foreground text-xs">{contact.role}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="border-border text-foreground hover:bg-muted flex items-center justify-center gap-1.5 rounded-xl border bg-white py-2.5 text-xs font-black">
          <Phone className="h-3.5 w-3.5" /> {contact.phone}
        </a>
        <a
          href={`https://wa.me/${contact.wa}?text=${encodeURIComponent(`Halo ${contact.name}, saya ${reg.name} sudah mendaftar akun PARAS di ${reg.kelurahan} dan menunggu persetujuan.`)}`}
          target="_blank"
          rel="noreferrer"
          className="bg-brand hover:bg-brand-dark flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </div>
    </div>
  );

  if (reg.status === 'approved') {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 text-center">
        <div className="bg-brand-light mb-5 flex h-24 w-24 items-center justify-center rounded-full">
          <CheckCircle2 className="text-brand h-12 w-12" />
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-black">Selamat Datang, {firstName}!</h2>
        <p className="text-muted-foreground mb-8 max-w-xs text-sm leading-relaxed">Akun Anda telah disetujui oleh admin PKK {reg.kelurahan}. Mulai berkontribusi untuk aksi iklim bersama komunitas.</p>
        <Link href="/" className="bg-brand flex w-full max-w-sm items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white">
          Mulai Sekarang <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (reg.status === 'rejected') {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-black">Pendaftaran Belum Disetujui</h2>
        <p className="text-muted-foreground mb-6 max-w-xs text-sm leading-relaxed">{reg.rejectReason}</p>
        <div className="w-full max-w-sm">
          <ContactCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 py-10 text-center">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-amber-100" />
          <span className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-500 motion-safe:animate-spin" aria-hidden />
          <Clock className="relative h-10 w-10 text-amber-600" />
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-black">Menunggu Persetujuan</h2>
        <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
          Email terverifikasi. Akun {reg.type === 'pkk' ? 'Anggota PKK' : 'Warga Umum'} Anda sedang ditinjau oleh admin PKK <span className="text-foreground font-bold">{reg.kelurahan}</span> dalam waktu 1x24 jam.
        </p>

        <div className={cn('mb-4 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left', overdue ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50')}>
          {overdue ? <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" /> : <Clock className="h-5 w-5 shrink-0 text-amber-600" />}
          <div>
            <p className={cn('text-sm font-black', overdue ? 'text-red-700' : 'text-amber-800')}>{overdue ? 'Melewati batas 1x24 jam' : `Batas persetujuan: ${formatRemaining(remaining)} lagi`}</p>
            <p className={cn('text-xs', overdue ? 'text-red-600' : 'text-amber-700')}>Anda akan diberi tahu lewat email {reg.email}</p>
          </div>
        </div>

        <button type="button" disabled aria-live="polite" className="mb-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 py-3.5 text-sm font-black text-slate-600">
          <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /> Menunggu persetujuan admin PKK…
        </button>

        <ContactCard emphasis={overdue} />
        <Link href="/" className="text-brand mt-5 text-sm font-bold">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
