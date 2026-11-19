'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, User, ChevronDown, ArrowRight, CheckCircle2, Clock, Users, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/public/logo.svg';
import { registerCommunity } from './actions';

const WILAYAH_API = 'https://www.emsifa.com/api-wilayah-indonesia/api';

// Dropdown yang dipakai ulang untuk 4 level wilayah
function AreaSelect({ id, label, value, onChange, options, placeholder, disabled, loading, error }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-foreground mb-1.5">
        {label} *
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={onChange}
          className={cn('w-full px-3 py-3 rounded-xl border text-sm outline-none appearance-none disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-pink')}
        >
          <option value="">{loading ? 'Memuat data...' : placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function CommunityRegisterPage() {
  const [step, setStep] = useState('form');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Nama field wilayah sengaja sama persis dengan yang dibaca actions.js:
  // provinceCode/Name, cityCode/Name, districtCode/Name, subdistrictCode/Name
  const [form, setForm] = useState({
    chairName: '',
    chairEmail: '',
    chairPhone: '',
    provinceCode: '',
    provinceName: '',
    cityCode: '',
    cityName: '',
    districtCode: '',
    districtName: '',
    subdistrictCode: '',
    subdistrictName: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  // Data dropdown dari API wilayah
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);

  // Level yang sedang dimuat: 'province' | 'city' | 'district' | 'subdistrict' | ''
  const [areaLoading, setAreaLoading] = useState('');
  const [areaError, setAreaError] = useState('');

  async function loadArea(path, setter, level) {
    setAreaLoading(level);
    setAreaError('');
    try {
      const res = await fetch(`${WILAYAH_API}/${path}.json`);
      if (!res.ok) throw new Error('Gagal memuat data wilayah');
      setter(await res.json());
    } catch (err) {
      console.error('Error fetching wilayah:', err);
      setAreaError('Data wilayah gagal dimuat. Periksa koneksi lalu coba lagi.');
    } finally {
      setAreaLoading('');
    }
  }

  // 1. Fetch provinsi saat halaman dimuat
  useEffect(() => {
    loadArea('provinces', setProvinces, 'province');
  }, []);

  // 2. Provinsi dipilih -> fetch kota/kabupaten
  function handleProvinceChange(e) {
    const id = e.target.value;
    const obj = provinces.find((p) => p.id === id);
    setForm((f) => ({
      ...f,
      provinceCode: id,
      provinceName: obj?.name || '',
      cityCode: '',
      cityName: '',
      districtCode: '',
      districtName: '',
      subdistrictCode: '',
      subdistrictName: '',
    }));
    setErrors((er) => ({ ...er, province: undefined }));
    setCities([]);
    setDistricts([]);
    setSubdistricts([]);
    if (id) loadArea(`regencies/${id}`, setCities, 'city');
  }

  // 3. Kota dipilih -> fetch kecamatan
  function handleCityChange(e) {
    const id = e.target.value;
    const obj = cities.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      cityCode: id,
      cityName: obj?.name || '',
      districtCode: '',
      districtName: '',
      subdistrictCode: '',
      subdistrictName: '',
    }));
    setErrors((er) => ({ ...er, city: undefined }));
    setDistricts([]);
    setSubdistricts([]);
    if (id) loadArea(`districts/${id}`, setDistricts, 'district');
  }

  // 4. Kecamatan dipilih -> fetch kelurahan
  function handleDistrictChange(e) {
    const id = e.target.value;
    const obj = districts.find((d) => d.id === id);
    setForm((f) => ({
      ...f,
      districtCode: id,
      districtName: obj?.name || '',
      subdistrictCode: '',
      subdistrictName: '',
    }));
    setErrors((er) => ({ ...er, district: undefined }));
    setSubdistricts([]);
    if (id) loadArea(`villages/${id}`, setSubdistricts, 'subdistrict');
  }

  // 5. Kelurahan dipilih
  function handleSubdistrictChange(e) {
    const id = e.target.value;
    const obj = subdistricts.find((s) => s.id === id);
    setForm((f) => ({ ...f, subdistrictCode: id, subdistrictName: obj?.name || '' }));
    setErrors((er) => ({ ...er, subdistrict: undefined }));
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.chairName.trim()) e.chairName = 'Nama ketua wajib diisi';
    if (!form.chairEmail.trim()) e.chairEmail = 'Email ketua wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.chairEmail)) e.chairEmail = 'Format email tidak valid';
    if (!form.chairPhone.trim()) e.chairPhone = 'Nomor HP ketua wajib diisi';
    else if (!/^(\+62|62|0)8\d{8,12}$/.test(form.chairPhone.replace(/[\s\-]/g, ''))) e.chairPhone = 'Nomor HP tidak valid';

    if (!form.provinceCode) e.province = 'Provinsi wajib dipilih';
    if (!form.cityCode) e.city = 'Kota/kabupaten wajib dipilih';
    if (!form.districtCode) e.district = 'Kecamatan wajib dipilih';
    if (!form.subdistrictCode) e.subdistrict = 'Kelurahan wajib dipilih';

    if (!form.password) e.password = 'Kata sandi wajib diisi';
    else if (form.password.length < 8) e.password = 'Kata sandi minimal 8 karakter';
    if (!form.confirmPassword) e.confirmPassword = 'Konfirmasi kata sandi wajib diisi';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Kata sandi tidak cocok';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setApiError('');

    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setIsLoading(true);

    try {
      // Server Action di actions.js
      const res = await registerCommunity(form);

      if (!res.success) {
        setApiError(res.message || 'Gagal mendaftarkan komunitas.');
        return;
      }

      setStep('submitted');
    } catch (err) {
      console.error('Error submitting form:', err);
      setApiError('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  }

  // TAMPILAN SUKSES
  if (step === 'submitted') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col px-6 bg-white">
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-24 h-24 rounded-full bg-brand-light flex items-center justify-center mb-5">
            <CheckCircle2 className="w-12 h-12 text-brand" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Pendaftaran Terkirim!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2 max-w-xs">
            Pendaftaran komunitas PKK{' '}
            <span className="font-bold text-foreground">
              Kel. {form.subdistrictName}, {form.cityName}
            </span>{' '}
            sedang kami proses.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
            Status pengajuan akan dikirim ke email <span className="font-bold text-foreground">{form.chairEmail}</span> dalam 1–3 hari kerja. Setelah disetujui, masuk ke dashboard admin dengan email dan kata sandi yang Anda buat. Anggota
            cukup mendaftar dengan alamat kelurahan yang sama.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8 flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-amber-800">Menunggu Verifikasi</p>
              <p className="text-xs text-amber-600">Admin akan meninjau data dalam 1–3 hari kerja</p>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <Link href="/admin/login" className="block w-full bg-brand text-white font-black py-3.5 rounded-xl text-sm text-center">
              Masuk ke Dashboard Admin
            </Link>
            <Link href="/" className="block w-full border-2 border-brand-light text-brand font-bold py-3 rounded-xl text-sm text-center hover:bg-brand-xlight">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN FORMULIR
  return (
    <div className="lg:bg-muted/30 lg:py-10 lg:px-6">
      <div className="max-w-2xl mx-auto lg:bg-white lg:rounded-3xl lg:shadow-lg lg:overflow-hidden">
        {/* Header */}
        <div className="relative bg-pink px-5 pt-6 pb-6 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 left-10 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white rounded-2xl px-4 py-2 mb-3 shadow-sm">
              <Image src={logo} alt="PARAS" className="h-14 w-auto object-contain" priority />
            </div>
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest">Untuk Pengurus PKK</span>
            <h1 className="text-xl font-black text-white leading-tight mb-1">Daftarkan Komunitas PKK Anda</h1>
            <p className="text-xs text-white/80 leading-relaxed max-w-xs">Daftarkan kelurahan PKK Anda ke PARAS dan kelola aksi anggota lewat dashboard admin.</p>
          </div>
        </div>

        <div className="px-5 pt-6 pb-10 bg-background">
          <div className="bg-pink-xlight border border-pink-light rounded-2xl p-4 mb-5 flex items-start gap-3">
            <Users className="w-5 h-5 text-pink flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-pink mb-1">Ini bukan untuk daftar akun pribadi</p>
              <p className="text-xs text-pink-dark leading-relaxed">
                Halaman ini khusus untuk mendaftarkan <span className="font-bold">organisasi PKK kelurahan</span>. Untuk daftar akun pribadi sebagai warga umum atau anggota PKK, silakan melalui halaman registrasi reguler.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Kartu: Data Ketua PKK */}
            <div className="bg-white rounded-2xl border border-border p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-brand" />
                <p className="text-xs font-black text-foreground uppercase tracking-wider">Data Ketua PKK</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Nama Ketua PKK *</label>
                <input
                  type="text"
                  value={form.chairName}
                  onChange={(e) => setField('chairName', e.target.value)}
                  placeholder="Nama lengkap ketua PKK"
                  className={cn('w-full px-3 py-3 rounded-xl border text-sm outline-none transition-colors', errors.chairName ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-pink focus:bg-white')}
                />
                {errors.chairName && <p className="text-xs text-red-500 mt-1">{errors.chairName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Email Ketua PKK *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.chairEmail}
                    onChange={(e) => setField('chairEmail', e.target.value)}
                    placeholder="email@ketua-pkk.com"
                    className={cn('w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors', errors.chairEmail ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-pink focus:bg-white')}
                  />
                </div>
                {errors.chairEmail && <p className="text-xs text-red-500 mt-1">{errors.chairEmail}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">Email ini dipakai untuk masuk ke dashboard admin setelah disetujui.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Nomor HP Ketua *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={form.chairPhone}
                    onChange={(e) => setField('chairPhone', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={cn('w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors', errors.chairPhone ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-pink focus:bg-white')}
                  />
                </div>
                {errors.chairPhone && <p className="text-xs text-red-500 mt-1">{errors.chairPhone}</p>}
              </div>
            </div>

            {/* Kartu: Wilayah PKK */}
            <div className="bg-white rounded-2xl border border-border p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-brand" />
                <p className="text-xs font-black text-foreground uppercase tracking-wider">Wilayah PKK</p>
              </div>

              <AreaSelect
                id="pkk-province"
                label="Provinsi"
                value={form.provinceCode}
                onChange={handleProvinceChange}
                options={provinces}
                placeholder="Pilih provinsi"
                disabled={areaLoading === 'province'}
                loading={areaLoading === 'province'}
                error={errors.province}
              />

              <AreaSelect
                id="pkk-city"
                label="Kota/Kabupaten"
                value={form.cityCode}
                onChange={handleCityChange}
                options={cities}
                placeholder="Pilih kota/kabupaten"
                disabled={!form.provinceCode || areaLoading === 'city'}
                loading={areaLoading === 'city'}
                error={errors.city}
              />

              <AreaSelect
                id="pkk-district"
                label="Kecamatan"
                value={form.districtCode}
                onChange={handleDistrictChange}
                options={districts}
                placeholder="Pilih kecamatan"
                disabled={!form.cityCode || areaLoading === 'district'}
                loading={areaLoading === 'district'}
                error={errors.district}
              />

              <AreaSelect
                id="pkk-subdistrict"
                label="Kelurahan"
                value={form.subdistrictCode}
                onChange={handleSubdistrictChange}
                options={subdistricts}
                placeholder="Pilih kelurahan"
                disabled={!form.districtCode || areaLoading === 'subdistrict'}
                loading={areaLoading === 'subdistrict'}
                error={errors.subdistrict}
              />

              {areaError && <p className="text-xs text-red-500">{areaError}</p>}
            </div>

            {/* Kartu: Akses dashboard admin */}
            <div className="bg-white rounded-2xl border border-border p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-brand" />
                <p className="text-xs font-black text-foreground uppercase tracking-wider">Akses Dashboard Admin</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed -mt-2">Ketua PKK masuk ke dashboard pengelola dengan email di atas dan kata sandi ini setelah pendaftaran disetujui.</p>

              {[
                { key: 'password', label: 'Kata Sandi *', placeholder: 'Minimal 8 karakter', autoComplete: 'new-password' },
                { key: 'confirmPassword', label: 'Konfirmasi Kata Sandi *', placeholder: 'Ulangi kata sandi', autoComplete: 'new-password' },
              ].map((f) => (
                <div key={f.key}>
                  <label htmlFor={`pkk-${f.key}`} className="block text-xs font-bold text-foreground mb-1.5">
                    {f.label}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id={`pkk-${f.key}`}
                      type={showPass ? 'text' : 'password'}
                      value={form[f.key]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      autoComplete={f.autoComplete}
                      className={cn('w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-colors', errors[f.key] ? 'border-red-300 bg-red-50' : 'border-border bg-muted focus:border-pink focus:bg-white')}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
                </div>
              ))}

              {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-brand">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kata sandi cocok
                </p>
              )}
            </div>

            {/* Error Message dari Server Action */}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">{apiError}</div>}

            {/* Tombol Submit dengan Loading State */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn('w-full font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-lg', isLoading ? 'bg-pink/70 cursor-not-allowed text-white' : 'bg-pink hover:bg-pink-dark text-white')}
            >
              {isLoading ? 'Memproses Data...' : 'Kirim Pendaftaran PKK'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Dengan mendaftar, Anda menyetujui syarat & ketentuan PARAS.
              <br />
              Setiap kelurahan hanya dapat memiliki satu pendaftaran aktif.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
