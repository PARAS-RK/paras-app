"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Phone, User, ChevronDown, ArrowRight, CheckCircle2, LoaderCircle, Clock, XCircle, MessageCircle, AlertTriangle } from 'lucide-react';
import { contactFor, deadlineOf, formatRemaining, submitRegistration, useRegistration } from '@/lib/memberStore';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import logo from '@/public/logo_paras_1.png';

/* Kelurahan whose PKK community is already registered and active on PARAS. */
const activePkkCommunities = new Set([
    'Jakarta Selatan|Kebayoran Baru|Kebayoran Baru',
    'Jakarta Selatan|Kebayoran Baru|Selong',
    'Jakarta Selatan|Tebet|Tebet Timur',
    'Kota Depok|Beji|Beji',
]);
const pkkKey = (f) => `${f.city}|${f.kecamatan}|${f.generalKelurahan}`;
const selectClass = (error) => cn('w-full appearance-none rounded-xl border px-3 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-red-300 bg-red-50' : 'border-border bg-white focus:border-brand');

export default function Register() {
    const [step, setStep] = useState('form');
    const [accountType, setAccountType] = useState('general');
    const [showPass, setShowPass] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    
    // State untuk data wilayah dinamis dari API
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        province: '',
        provinceId: '',
        city: '',
        cityId: '',
        kecamatan: '',
        kecamatanId: '',
        generalKelurahan: '',
    });
    
    const [errors, setErrors] = useState({});
    const [registrationId, setRegistrationId] = useState(null);
    const locationComplete = Boolean(form.generalKelurahan);
    const pkkActive = locationComplete && activePkkCommunities.has(pkkKey(form));
    const pkkBlocked = accountType === 'pkk' && locationComplete && !pkkActive;

    // 1. Ambil data Provinsi saat komponen pertama kali dimuat
    useEffect(() => {
        fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
            .then((res) => res.json())
            .then((data) => setProvinces(data))
            .catch((err) => console.error("Gagal memuat data provinsi:", err));
    }, []);

    // Handler saat Provinsi dipilih
    const handleProvinceChange = (e) => {
        const selectedName = e.target.value;
        const selectedObj = provinces.find((p) => p.name === selectedName);
        
        setForm({
            ...form,
            province: selectedName,
            provinceId: selectedObj ? selectedObj.id : '',
            city: '', cityId: '', kecamatan: '', kecamatanId: '', generalKelurahan: ''
        });
        setErrors({ ...errors, province: undefined });

        if (selectedObj) {
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedObj.id}.json`)
                .then((res) => res.json())
                .then((data) => setRegencies(data))
                .catch((err) => console.error("Gagal memuat data kabupaten/kota:", err));
        } else {
            setRegencies([]);
        }
        setDistricts([]);
        setVillages([]);
    };

    // Handler saat Kota/Kabupaten dipilih
    const handleCityChange = (e) => {
        const selectedName = e.target.value;
        const selectedObj = regencies.find((r) => r.name === selectedName);

        setForm({
            ...form,
            city: selectedName,
            cityId: selectedObj ? selectedObj.id : '',
            kecamatan: '', kecamatanId: '', generalKelurahan: ''
        });
        setErrors({ ...errors, city: undefined });

        if (selectedObj) {
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedObj.id}.json`)
                .then((res) => res.json())
                .then((data) => setDistricts(data))
                .catch((err) => console.error("Gagal memuat data kecamatan:", err));
        } else {
            setDistricts([]);
        }
        setVillages([]);
    };

    // Handler saat Kecamatan dipilih
    const handleKecamatanChange = (e) => {
        const selectedName = e.target.value;
        const selectedObj = districts.find((d) => d.name === selectedName);

        setForm({
            ...form,
            kecamatan: selectedName,
            kecamatanId: selectedObj ? selectedObj.id : '',
            generalKelurahan: ''
        });
        setErrors({ ...errors, kecamatan: undefined });

        if (selectedObj) {
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedObj.id}.json`)
                .then((res) => res.json())
                .then((data) => setVillages(data))
                .catch((err) => console.error("Gagal memuat data kelurahan:", err));
        } else {
            setVillages([]);
        }
    };

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = 'Nama wajib diisi';
        if (!form.email.trim()) e.email = 'Email wajib diisi';
        if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi';
        if (!form.password || form.password.length < 8) e.password = 'Kata sandi minimal 8 karakter';
        if (!form.province) e.province = 'Pilih provinsi';
        if (!form.city) e.city = 'Pilih kota/kabupaten';
        if (!form.kecamatan) e.kecamatan = 'Pilih kecamatan';
        if (!form.generalKelurahan) e.generalKelurahan = 'Pilih kelurahan';
        else if (accountType === 'pkk' && !pkkActive) e.generalKelurahan = 'Komunitas PKK di kelurahan ini belum terdaftar';
        return e;
    }

    function handleSubmit(ev) {
        ev.preventDefault();
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }
        setStep('otp');
    }

    function handleOtpChange(i, val) {
        const next = [...otp];
        next[i] = val.slice(-1);
        setOtp(next);
        if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
    }

    if (step === 'otp') {
        return (
            <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 pb-10 bg-white">
                <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-5">
                    <Mail className="w-8 h-8 text-brand"/>
                </div>
                <h2 className="text-2xl font-black text-foreground mb-2 text-center">Verifikasi Email</h2>
                <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
                    Masukkan kode 6 digit yang kami kirim ke{' '}
                    <span className="font-bold text-foreground">{form.email}</span>
                </p>
                <div className="flex gap-2 mb-8">
                    {otp.map((digit, i) => (
                        <input 
                            key={i} 
                            id={`otp-${i}`} 
                            type="text" 
                            inputMode="numeric" 
                            maxLength={1} 
                            value={digit} 
                            onChange={(e) => handleOtpChange(i, e.target.value)} 
                            className={cn('w-11 h-13 text-center text-lg font-black border-2 rounded-xl outline-none transition-colors', digit ? 'border-brand bg-brand-light text-brand' : 'border-border bg-muted text-foreground')}
                        />
                    ))}
                </div>
                <button 
                    onClick={() => {
                        if (otp.join('').length < 6) return;
                        setRegistrationId(submitRegistration({
                            name: form.name.trim(), 
                            email: form.email.trim(), 
                            phone: form.phone.trim(), 
                            type: accountType,
                            province: form.province, 
                            city: form.city, 
                            kecamatan: form.kecamatan, 
                            kelurahan: `Kel. ${form.generalKelurahan}`,
                        }));
                        setStep('done');
                    }} 
                    disabled={otp.join('').length < 6} 
                    className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-black py-3.5 rounded-xl mb-4 transition-colors"
                >
                    Verifikasi
                </button>
                <button className="text-sm text-muted-foreground">
                    Tidak menerima kode?{' '}
                    <span className="text-pink font-bold">Kirim ulang</span>
                </button>
            </div>
        );
    }

    if (step === 'done')
        return <ApprovalPending id={registrationId} firstName={form.name.split(' ')[0]}/>;

    return (
        <div className="lg:flex lg:items-start lg:justify-center lg:bg-muted/30 lg:py-12 lg:px-6 lg:min-h-[calc(100vh-64px)]">
            <div className="w-full max-w-lg mx-auto lg:bg-white lg:rounded-3xl lg:shadow-lg lg:overflow-hidden">
                <div className="bg-gradient-to-b from-brand-xlight to-white px-6 pt-8 pb-6 flex flex-col items-center text-center">
                    <Image src={logo} alt="PARAS" className="h-16 w-auto object-contain mb-5" />
                    <h1 className="text-2xl font-black text-foreground">Daftar Akun</h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        Untuk pengguna perorangan — warga umum maupun anggota PKK
                    </p>
                </div>

                <div className="px-6 pb-10 bg-white">
                    {/* Google */}
                    <button className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-2xl py-3.5 text-sm font-semibold text-foreground shadow-sm mb-6 hover:bg-muted transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Daftar dengan Google
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-border"/>
                        <span className="text-xs text-muted-foreground">atau isi formulir</span>
                        <div className="flex-1 h-px bg-border"/>
                    </div>

                    {/* Account type */}
                    <div className="mb-5">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Kategori Akun</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { val: 'general', label: 'Umum', desc: 'Warga & masyarakat', icon: '👤' },
                                { val: 'pkk', label: 'Anggota PKK', desc: 'Bergabung lewat alamat kelurahan', icon: '🤝' },
                            ].map((t) => (
                                <button key={t.val} type="button" onClick={() => { setAccountType(t.val); setErrors((e) => ({ ...e, generalKelurahan: undefined })); }} className={cn('text-left p-3.5 rounded-2xl border-2 transition-colors', accountType === t.val ? 'border-brand bg-brand-xlight' : 'border-border bg-white hover:bg-muted')}>
                                    <span className="text-xl block mb-1.5">{t.icon}</span>
                                    <span className={cn('text-sm font-black block', accountType === t.val ? 'text-brand' : 'text-foreground')}>{t.label}</span>
                                    <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[
                            { name: 'name', label: 'Nama Lengkap', placeholder: 'Nama lengkap Anda', type: 'text', icon: User },
                            { name: 'email', label: 'Email', placeholder: 'email@contoh.com', type: 'email', icon: Mail },
                            { name: 'phone', label: 'Nomor HP', placeholder: '08xxxxxxxxxx', type: 'tel', icon: Phone },
                        ].map(({ name, label, placeholder, type, icon: Icon }) => (
                            <div key={name}>
                                <label className="block text-xs font-bold text-foreground mb-1.5">{label}</label>
                                <div className="relative">
                                    <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                                    <input type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder} className={cn('w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors', errors[name] ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}/>
                                </div>
                                {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
                            </div>
                        ))}

                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5">Kata Sandi</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" className={cn('w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-colors', errors.password ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-brand focus:bg-white')}/>
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>

                        {/* Dropdown Domisili API Publik */}
                        <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Lokasi Domisili
                            </p>
                            {accountType === 'pkk' && (
                                <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
                                    Anda otomatis tergabung dengan komunitas PKK yang terdaftar di kelurahan yang sama.
                                </p>
                            )}
                            
                            {/* Provinsi */}
                            <div>
                                <label htmlFor="reg-province" className="mb-1.5 block text-xs font-bold text-foreground">Provinsi</label>
                                <div className="relative">
                                    <select id="reg-province" value={form.province} onChange={handleProvinceChange} className={selectClass(errors.province)}>
                                        <option value="">Pilih provinsi</option>
                                        {provinces.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                </div>
                                {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
                            </div>

                            {/* Kota/Kabupaten */}
                            <div>
                                <label htmlFor="reg-city" className="mb-1.5 block text-xs font-bold text-foreground">Kota/Kabupaten</label>
                                <div className="relative">
                                    <select id="reg-city" value={form.city} disabled={!form.province} onChange={handleCityChange} className={selectClass(errors.city)}>
                                        <option value="">Pilih kota/kabupaten</option>
                                        {regencies.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                </div>
                                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                            </div>

                            {/* Kecamatan */}
                            <div>
                                <label htmlFor="reg-kecamatan" className="mb-1.5 block text-xs font-bold text-foreground">Kecamatan</label>
                                <div className="relative">
                                    <select id="reg-kecamatan" value={form.kecamatan} disabled={!form.city} onChange={handleKecamatanChange} className={selectClass(errors.kecamatan)}>
                                        <option value="">Pilih kecamatan</option>
                                        {districts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                </div>
                                {errors.kecamatan && <p className="mt-1 text-xs text-red-500">{errors.kecamatan}</p>}
                            </div>

                            {/* Kelurahan */}
                            <div>
                                <label htmlFor="reg-generalKelurahan" className="mb-1.5 block text-xs font-bold text-foreground">Kelurahan</label>
                                <div className="relative">
                                    <select id="reg-generalKelurahan" value={form.generalKelurahan} disabled={!form.kecamatan} onChange={(e) => { setForm({ ...form, generalKelurahan: e.target.value }); setErrors({ ...errors, generalKelurahan: undefined }); }} className={selectClass(errors.generalKelurahan)}>
                                        <option value="">Pilih kelurahan</option>
                                        {villages.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                </div>
                                {errors.generalKelurahan && !pkkBlocked && <p className="mt-1 text-xs text-red-500">{errors.generalKelurahan}</p>}
                            </div>

                            {accountType === 'pkk' && pkkActive && (
                                <div role="status" className="flex items-start gap-2.5 rounded-xl border border-brand-light bg-brand-xlight p-3">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand"/>
                                    <div>
                                        <p className="text-xs font-black text-brand-dark">Komunitas PKK Anda sudah aktif</p>
                                        <p className="mt-0.5 text-xs text-brand-dark/80">PKK Kel. {form.generalKelurahan} sudah terdaftar di PARAS. Silakan lanjutkan pendaftaran.</p>
                                    </div>
                                </div>
                            )}
                            {pkkBlocked && (
                                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <div className="flex items-start gap-2.5">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"/>
                                        <div>
                                            <p className="text-xs font-black text-amber-800">Komunitas PKK belum terdaftar</p>
                                            <p className="mt-0.5 text-xs leading-relaxed text-amber-700">PKK Kel. {form.generalKelurahan} belum terdaftar di PARAS. Ketua PKK perlu mendaftarkan komunitasnya terlebih dahulu sebelum anggota dapat membuat akun.</p>
                                        </div>
                                    </div>
                                    <Link to="/daftar/community" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-pink py-2.5 text-xs font-black text-white hover:bg-pink-dark">
                                        Daftarkan Komunitas PKK <ArrowRight className="h-3.5 w-3.5"/>
                                    </Link>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={pkkBlocked} className="w-full bg-brand hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm mt-2 transition-colors">
                            Daftar & Verifikasi Email <ArrowRight className="w-4 h-4"/>
                        </button>
                    </form>

                    <div className="mt-6 space-y-3 text-center">
                        <p className="text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="text-brand font-black">Masuk</Link>
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border"/>
                            <span className="text-[10px] text-muted-foreground">Daftarkan komunitas PKK?</span>
                            <div className="flex-1 h-px bg-border"/>
                        </div>
                        <Link href="/pkk/community" className="block w-full border-2 border-pink text-pink font-black py-3 rounded-xl text-sm hover:bg-pink-xlight transition-colors">
                            Daftar Komunitas PKK →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function useNow(interval = 30000) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(t); }, [interval]);
    return now;
}

/* Waits for the PKK admin of the applicant's kelurahan to approve within 1x24 hours. */
function ApprovalPending({ id, firstName }) {
    const reg = useRegistration(id);
    const now = useNow();
    if (!reg) return null;
    const contact = contactFor(reg.kelurahan);
    const remaining = deadlineOf(reg) - now;
    const overdue = remaining <= 0;
    const ContactCard = ({ emphasis }) => (
        <div className={cn('w-full rounded-2xl border p-4 text-left', emphasis ? 'border-red-200 bg-red-50' : 'border-border bg-muted/40')}>
            <p className={cn('text-xs font-black', emphasis ? 'text-red-700' : 'text-foreground')}>
                {emphasis ? 'Sudah lebih dari 1x24 jam? Hubungi admin PKK Anda' : 'Lebih dari 1x24 jam? Hubungi admin PKK setempat'}
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{contact.name}</p>
            <p className="text-xs text-muted-foreground">{contact.role}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white py-2.5 text-xs font-black text-foreground hover:bg-muted"><Phone className="h-3.5 w-3.5"/> {contact.phone}</a>
                <a href={`https://wa.me/${contact.wa}?text=${encodeURIComponent(`Halo ${contact.name}, saya ${reg.name} sudah mendaftar akun PARAS di ${reg.kelurahan} dan menunggu persetujuan.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-xs font-black text-white hover:bg-brand-dark"><MessageCircle className="h-3.5 w-3.5"/> WhatsApp</a>
            </div>
        </div>
    );

    if (reg.status === 'approved') {
        return (
            <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center bg-white">
                <div className="w-24 h-24 rounded-full bg-brand-light flex items-center justify-center mb-5"><CheckCircle2 className="w-12 h-12 text-brand"/></div>
                <h2 className="text-2xl font-black text-foreground mb-2">Selamat Datang, {firstName}!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xs">Akun Anda telah disetujui oleh admin PKK {reg.kelurahan}. Mulai berkontribusi untuk aksi iklim bersama komunitas.</p>
                <Link to="/login" className="w-full max-w-sm flex items-center justify-center gap-2 bg-brand text-white font-black py-3.5 rounded-xl text-sm">Lanjut Masuk <ArrowRight className="w-4 h-4"/></Link>
            </div>
        );
    }
    if (reg.status === 'rejected') {
        return (
            <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center bg-white">
                <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-5"><XCircle className="w-12 h-12 text-red-600"/></div>
                <h2 className="text-2xl font-black text-foreground mb-2">Pendaftaran Belum Disetujui</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">{reg.rejectReason}</p>
                <div className="w-full max-w-sm"><ContactCard /></div>
            </div>
        );
    }
    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-10 text-center bg-white">
            <div className="w-full max-w-sm flex flex-col items-center">
                <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-amber-100"/>
                    <span className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-500 motion-safe:animate-spin" aria-hidden/>
                    <Clock className="relative w-10 h-10 text-amber-600"/>
                </div>
                <h2 className="text-2xl font-black text-foreground mb-2">Menunggu Persetujuan</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    Email terverifikasi. Akun {reg.type === 'pkk' ? 'Anggota PKK' : 'Warga Umum'} Anda sedang ditinjau oleh admin PKK <span className="font-bold text-foreground">{reg.kelurahan}</span> dalam waktu 1x24 jam.
                </p>

                <div className={cn('w-full rounded-2xl border px-4 py-3 mb-4 flex items-center gap-3 text-left', overdue ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50')}>
                    {overdue ? <AlertTriangle className="w-5 h-5 shrink-0 text-red-600"/> : <Clock className="w-5 h-5 shrink-0 text-amber-600"/>}
                    <div>
                        <p className={cn('text-sm font-black', overdue ? 'text-red-700' : 'text-amber-800')}>{overdue ? 'Melewati batas 1x24 jam' : `Batas persetujuan: ${formatRemaining(remaining)} lagi`}</p>
                        <p className={cn('text-xs', overdue ? 'text-red-600' : 'text-amber-700')}>Anda akan diberi tahu lewat email {reg.email}</p>
                    </div>
                </div>

                <button type="button" disabled aria-live="polite" className="w-full mb-5 flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3.5 text-sm font-black text-slate-600 cursor-not-allowed">
                    <LoaderCircle className="w-4 h-4 motion-safe:animate-spin"/> Menunggu persetujuan admin PKK…
                </button>

                <ContactCard emphasis={overdue}/>
                <Link href="/" className="mt-5 text-sm font-bold text-brand">Kembali ke Beranda</Link>
            </div>
        </div>
    );
}