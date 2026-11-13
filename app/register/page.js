'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  User,
  XCircle,
} from 'lucide-react'

import {
  contactFor,
  deadlineOf,
  formatRemaining,
  submitRegistration,
  useRegistration,
} from '../../lib/memberStore'
import { cn } from '../../lib/utils'
import logo from '../../public/logo_paras_1.png'
import { createClient } from '../../lib/supabase/client'

/* Kelurahan whose PKK community is already registered and active on PARAS. */
const activePkkCommunities = new Set([
  'Jakarta Selatan|Kebayoran Baru|Kebayoran Baru',
  'Jakarta Selatan|Kebayoran Baru|Selong',
  'Jakarta Selatan|Tebet|Tebet Timur',
  'Kota Depok|Beji|Beji',
])

const pkkKey = (f) => `${f.city}|${f.kecamatan}|${f.generalKelurahan}`

const selectClass = (error) =>
  cn(
    'w-full appearance-none rounded-xl border px-3 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
    error ? 'border-red-300 bg-red-50' : 'border-border bg-white focus:border-brand'
  )

// Helper to generate secure nonce for Google ID Token Sign-In
const generateNonce = async () => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return [nonce, hashedNonce]
}

export default function Register() {
  const supabase = createClient()
  const router = useRouter()

  const [step, setStep] = useState('form')
  const [accountType, setAccountType] = useState('general')
  const [showPass, setShowPass] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  // Loading & feedback states
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [authError, setAuthError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpInfo, setOtpInfo] = useState('')

  // Dynamic region state
  const [provinces, setProvinces] = useState([])
  const [regencies, setRegencies] = useState([])
  const [districts, setDistricts] = useState([])
  const [villages, setVillages] = useState([])

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
  })

  const [errors, setErrors] = useState({})
  const [registrationId, setRegistrationId] = useState(null)

  const locationComplete = Boolean(form.generalKelurahan)
  const pkkActive = locationComplete && activePkkCommunities.has(pkkKey(form))
  const pkkBlocked = accountType === 'pkk' && locationComplete && !pkkActive

  // Fetch Provinces on Mount
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error('Gagal memuat data provinsi:', err))
  }, [])

  // Initialize Google One Tap
  const initializeGoogleOneTap = async () => {
    try {
      const [nonce, hashedNonce] = await generateNonce()

      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Error checking session:', sessionError)
      }

      if (data?.session) {
        router.push('/')
        return
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const { error: signInError } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce,
              })

              if (signInError) throw signInError
              router.push('/')
            } catch (err) {
              console.error('Error logging in with Google One Tap', err)
            }
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
        })
      }
    } catch (err) {
      console.error('Failed to initialize Google Auth:', err)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Error logging in with Google:', err.message)
    }
  }

  const handleProvinceChange = (e) => {
    const selectedName = e.target.value
    const selectedObj = provinces.find((p) => p.name === selectedName)

    setForm({
      ...form,
      province: selectedName,
      provinceId: selectedObj ? selectedObj.id : '',
      city: '',
      cityId: '',
      kecamatan: '',
      kecamatanId: '',
      generalKelurahan: '',
    })
    setErrors({ ...errors, province: '' })

    if (selectedObj) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedObj.id}.json`)
        .then((res) => res.json())
        .then((data) => setRegencies(data))
        .catch((err) => console.error('Gagal memuat data kabupaten/kota:', err))
    } else {
      setRegencies([])
    }
    setDistricts([])
    setVillages([])
  }

  const handleCityChange = (e) => {
    const selectedName = e.target.value
    const selectedObj = regencies.find((r) => r.name === selectedName)

    setForm({
      ...form,
      city: selectedName,
      cityId: selectedObj ? selectedObj.id : '',
      kecamatan: '',
      kecamatanId: '',
      generalKelurahan: '',
    })
    setErrors({ ...errors, city: '' })

    if (selectedObj) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedObj.id}.json`)
        .then((res) => res.json())
        .then((data) => setDistricts(data))
        .catch((err) => console.error('Gagal memuat data kecamatan:', err))
    } else {
      setDistricts([])
    }
    setVillages([])
  }

  const handleKecamatanChange = (e) => {
    const selectedName = e.target.value
    const selectedObj = districts.find((d) => d.name === selectedName)

    setForm({
      ...form,
      kecamatan: selectedName,
      kecamatanId: selectedObj ? selectedObj.id : '',
      generalKelurahan: '',
    })
    setErrors({ ...errors, kecamatan: '' })

    if (selectedObj) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedObj.id}.json`)
        .then((res) => res.json())
        .then((data) => setVillages(data))
        .catch((err) => console.error('Gagal memuat data kelurahan:', err))
    } else {
      setVillages([])
    }
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.email.trim()) e.email = 'Email wajib diisi'
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi'
    if (!form.password || form.password.length < 8) e.password = 'Kata sandi minimal 8 karakter'
    if (!form.province) e.province = 'Pilih provinsi'
    if (!form.city) e.city = 'Pilih kota/kabupaten'
    if (!form.kecamatan) e.kecamatan = 'Pilih kecamatan'
    if (!form.generalKelurahan) e.generalKelurahan = 'Pilih kelurahan'
    else if (accountType === 'pkk' && !pkkActive)
      e.generalKelurahan = 'Komunitas PKK di kelurahan ini belum terdaftar'
    return e
  }

  // Kirim pendaftaran ke Supabase Auth sehingga email OTP otomatis terkirim
  async function handleSubmit(ev) {
    ev.preventDefault()
    setAuthError('')
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            phone_number: form.phone.trim(),
            account_category: accountType === 'pkk' ? 'PKK' : 'Umum',
            province: form.province,
            city: form.city,
            district: form.kecamatan,
            subdistrict: form.generalKelurahan,
          },
        },
      })

      if (error) throw error

      // Jika email sudah terdaftar dan terkonfirmasi sebelumnya, Supabase mengembalikan identities kosong
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setAuthError('Email ini sudah terdaftar. Silakan langsung masuk melalui halaman Login.')
        return
      }

      setOtp(['', '', '', '', '', ''])
      setOtpError('')
      setOtpInfo('')
      setStep('otp')
    } catch (err) {
      console.error('Error signUp:', err)
      setAuthError(err.message || 'Gagal mendaftar & mengirim kode OTP ke email.')
    } finally {
      setSubmitting(false)
    }
  }

  // Verifikasi 6 digit kode OTP ke Supabase
  async function handleVerifyOtp() {
    const token = otp.join('')
    if (token.length < 6 || verifying) return

    setVerifying(true)
    setOtpError('')
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: form.email.trim(),
        token,
        type: 'signup',
      })

      if (error) throw error

      setRegistrationId(
        submitRegistration({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          type: accountType,
          province: form.province,
          city: form.city,
          kecamatan: form.kecamatan,
          kelurahan: `Kel. ${form.generalKelurahan}`,
        })
      )
      setStep('done')
    } catch (err) {
      console.error('Error verifyOtp:', err)
      setOtpError(err.message || 'Kode OTP tidak valid atau sudah kedaluwarsa.')
    } finally {
      setVerifying(false)
    }
  }

  // Kirim ulang kode OTP
  async function handleResendOtp() {
    if (resending) return
    setResending(true)
    setOtpError('')
    setOtpInfo('')
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email.trim(),
      })
      if (error) throw error
      setOtpInfo('Kode verifikasi baru telah dikirim ke email Anda.')
    } catch (err) {
      console.error('Error resend OTP:', err)
      setOtpError(err.message || 'Gagal mengirim ulang kode OTP. Tunggu sebentar lalu coba lagi.')
    } finally {
      setResending(false)
    }
  }

  function handleOtpChange(i, val) {
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    setOtpError('')
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  if (step === 'otp') {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 pb-10">
        <div className="bg-brand-light mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Mail className="text-brand h-8 w-8" />
        </div>
        <h2 className="text-foreground mb-2 text-center text-2xl font-black">Verifikasi Email</h2>
        <p className="text-muted-foreground mb-6 text-center text-sm leading-relaxed">
          Masukkan kode 6 digit yang kami kirim ke{' '}
          <span className="text-foreground font-bold">{form.email}</span>
        </p>

        {otpError && (
          <div role="alert" className="mb-4 w-full max-w-xs rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-xs font-semibold text-red-600">
            {otpError}
          </div>
        )}

        {otpInfo && (
          <div role="status" className="border-brand-light bg-brand-xlight text-brand-dark mb-4 w-full max-w-xs rounded-xl border px-3.5 py-2.5 text-center text-xs font-semibold">
            {otpInfo}
          </div>
        )}

        <div className="mb-8 flex gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              className={cn(
                'h-13 w-11 rounded-xl border-2 text-center text-lg font-black outline-none transition-colors',
                digit
                  ? 'border-brand bg-brand-light text-brand'
                  : 'bg-muted text-foreground border-border'
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={otp.join('').length < 6 || verifying}
          className="bg-brand hover:bg-brand-dark mb-4 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl py-3.5 font-black text-white transition-colors disabled:opacity-50"
        >
          {verifying ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" /> Memverifikasi...
            </>
          ) : (
            'Verifikasi'
          )}
        </button>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resending}
          className="text-muted-foreground text-sm disabled:opacity-50"
        >
          Tidak menerima kode?{' '}
          <span className="text-pink font-bold">{resending ? 'Mengirim...' : 'Kirim ulang'}</span>
        </button>
      </div>
    )
  }

  if (step === 'done') {
    return <ApprovalPending id={registrationId} firstName={form.name.split(' ')[0]} />
  }

  return (
    <>
      <Script onReady={initializeGoogleOneTap} src="https://accounts.google.com/gsi/client" />
      <div className="lg:bg-muted/30 lg:flex lg:min-h-[calc(100vh-64px)] lg:items-start lg:justify-center lg:px-6 lg:py-12">
        <div className="mx-auto w-full max-w-lg lg:overflow-hidden lg:rounded-3xl lg:bg-white lg:shadow-lg">
          <div className="bg-gradient-to-b from-brand-xlight to-white flex flex-col items-center px-6 pt-8 pb-6 text-center">
            <Image src={logo} alt="PARAS" className="mb-5 h-16 w-auto object-contain" />
            <h1 className="text-foreground text-2xl font-black">Daftar Akun</h1>
            <p className="text-muted-foreground mt-1 max-w-xs text-sm">
              Untuk pengguna perorangan — warga umum maupun anggota PKK
            </p>
          </div>

          <div className="bg-white px-6 pb-10">
            {/* Google OAuth / One Tap Trigger */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="border-border text-foreground hover:bg-muted mb-6 flex w-full items-center justify-center gap-3 rounded-2xl border bg-white py-3.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Daftar dengan Google
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="bg-border h-px flex-1" />
              <span className="text-muted-foreground text-xs">atau isi formulir</span>
              <div className="bg-border h-px flex-1" />
            </div>

            {authError && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-600">
                {authError}
              </div>
            )}

            {/* Account type */}
            <div className="mb-5">
              <p className="text-foreground mb-2 text-xs font-bold uppercase tracking-wider">
                Kategori Akun
              </p>
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
                      setAccountType(t.val)
                      setErrors((e) => ({ ...e, generalKelurahan: '' }))
                    }}
                    className={cn(
                      'rounded-2xl border-2 p-3.5 text-left transition-colors',
                      accountType === t.val
                        ? 'border-brand bg-brand-xlight'
                        : 'border-border hover:bg-muted bg-white'
                    )}
                  >
                    <span className="mb-1.5 block text-xl">{t.icon}</span>
                    <span
                      className={cn(
                        'block text-sm font-black',
                        accountType === t.val ? 'text-brand' : 'text-foreground'
                      )}
                    >
                      {t.label}
                    </span>
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
                      className={cn(
                        'w-full rounded-xl border py-3 pr-4 pl-10 text-sm outline-none transition-colors',
                        errors[name]
                          ? 'border-red-300 bg-red-50'
                          : 'border-border bg-muted focus:border-brand focus:bg-white'
                      )}
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
                    className={cn(
                      'w-full rounded-xl border py-3 pr-11 pl-10 text-sm outline-none transition-colors',
                      errors.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-border bg-muted focus:border-brand focus:bg-white'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-muted-foreground absolute top-1/2 right-3.5 -translate-y-1/2"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Dynamic Location Selectors */}
              <div className="border-border bg-muted/40 space-y-4 rounded-2xl border p-4">
                <p className="text-foreground text-xs font-bold uppercase tracking-wider">
                  Lokasi Domisili
                </p>
                {accountType === 'pkk' && (
                  <p className="text-muted-foreground -mt-2 text-xs leading-relaxed">
                    Anda otomatis tergabung dengan komunitas PKK yang terdaftar di kelurahan yang sama.
                  </p>
                )}

                {/* Province */}
                <div>
                  <label
                    htmlFor="reg-province"
                    className="text-foreground mb-1.5 block text-xs font-bold"
                  >
                    Provinsi
                  </label>
                  <div className="relative">
                    <select
                      id="reg-province"
                      value={form.province}
                      onChange={handleProvinceChange}
                      className={selectClass(errors.province)}
                    >
                      <option value="">Pilih provinsi</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  </div>
                  {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="reg-city" className="text-foreground mb-1.5 block text-xs font-bold">
                    Kota/Kabupaten
                  </label>
                  <div className="relative">
                    <select
                      id="reg-city"
                      value={form.city}
                      disabled={!form.province}
                      onChange={handleCityChange}
                      className={selectClass(errors.city)}
                    >
                      <option value="">Pilih kota/kabupaten</option>
                      {regencies.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  </div>
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                </div>

                {/* District */}
                <div>
                  <label
                    htmlFor="reg-kecamatan"
                    className="text-foreground mb-1.5 block text-xs font-bold"
                  >
                    Kecamatan
                  </label>
                  <div className="relative">
                    <select
                      id="reg-kecamatan"
                      value={form.kecamatan}
                      disabled={!form.city}
                      onChange={handleKecamatanChange}
                      className={selectClass(errors.kecamatan)}
                    >
                      <option value="">Pilih kecamatan</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  </div>
                  {errors.kecamatan && <p className="mt-1 text-xs text-red-500">{errors.kecamatan}</p>}
                </div>

                {/* Village / Kelurahan */}
                <div>
                  <label
                    htmlFor="reg-generalKelurahan"
                    className="text-foreground mb-1.5 block text-xs font-bold"
                  >
                    Kelurahan
                  </label>
                  <div className="relative">
                    <select
                      id="reg-generalKelurahan"
                      value={form.generalKelurahan}
                      disabled={!form.kecamatan}
                      onChange={(e) => {
                        setForm({ ...form, generalKelurahan: e.target.value })
                        setErrors({ ...errors, generalKelurahan: '' })
                      }}
                      className={selectClass(errors.generalKelurahan)}
                    >
                      <option value="">Pilih kelurahan</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  </div>
                  {errors.generalKelurahan && !pkkBlocked && (
                    <p className="mt-1 text-xs text-red-500">{errors.generalKelurahan}</p>
                  )}
                </div>

                {accountType === 'pkk' && pkkActive && (
                  <div
                    role="status"
                    className="border-brand-light bg-brand-xlight flex items-start gap-2.5 rounded-xl border p-3"
                  >
                    <CheckCircle2 className="text-brand mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-brand-dark text-xs font-black">
                        Komunitas PKK Anda sudah aktif
                      </p>
                      <p className="text-brand-dark/80 mt-0.5 text-xs">
                        PKK Kel. {form.generalKelurahan} sudah terdaftar di PARAS. Silakan lanjutkan
                        pendaftaran.
                      </p>
                    </div>
                  </div>
                )}

                {pkkBlocked && (
                  <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-black text-amber-800">
                          Komunitas PKK belum terdaftar
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                          PKK Kel. {form.generalKelurahan} belum terdaftar di PARAS. Ketua PKK
                          perlu mendaftarkan komunitasnya terlebih dahulu sebelum anggota dapat membuat
                          akun.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/daftar/community"
                      className="bg-pink hover:bg-pink-dark mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black text-white"
                    >
                      Daftarkan Komunitas PKK <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={pkkBlocked || submitting}
                className="bg-brand hover:bg-brand-dark mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Mengirim Kode OTP...
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
              <Link
                href="/pkk/community"
                className="border-pink text-pink hover:bg-pink-xlight block w-full rounded-xl border-2 py-3 text-sm font-black transition-colors"
              >
                Daftar Komunitas PKK →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function useNow(interval = 30000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

/* Waits for the PKK admin of the applicant's kelurahan to approve within 1x24 hours. */
function ApprovalPending({ id, firstName }) {
  const reg = useRegistration(id)
  const now = useNow()

  if (!reg) return null

  const contact = contactFor(reg.kelurahan)
  const remaining = deadlineOf(reg) - now
  const overdue = remaining <= 0

  const ContactCard = ({ emphasis }) => (
    <div
      className={cn(
        'w-full rounded-2xl border p-4 text-left',
        emphasis ? 'border-red-200 bg-red-50' : 'border-border bg-muted/40'
      )}
    >
      <p className={cn('text-xs font-black', emphasis ? 'text-red-700' : 'text-foreground')}>
        {emphasis
          ? 'Sudah lebih dari 1x24 jam? Hubungi admin PKK Anda'
          : 'Lebih dari 1x24 jam? Hubungi admin PKK setempat'}
      </p>
      <p className="text-foreground mt-1 text-sm font-bold">{contact.name}</p>
      <p className="text-muted-foreground text-xs">{contact.role}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
          className="border-border text-foreground hover:bg-muted flex items-center justify-center gap-1.5 rounded-xl border bg-white py-2.5 text-xs font-black"
        >
          <Phone className="h-3.5 w-3.5" /> {contact.phone}
        </a>
        <a
          href={`https://wa.me/${contact.wa}?text=${encodeURIComponent(
            `Halo ${contact.name}, saya ${reg.name} sudah mendaftar akun PARAS di ${reg.kelurahan} dan menunggu persetujuan.`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="bg-brand hover:bg-brand-dark flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </div>
    </div>
  )

  if (reg.status === 'approved') {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 text-center">
        <div className="bg-brand-light mb-5 flex h-24 w-24 items-center justify-center rounded-full">
          <CheckCircle2 className="text-brand h-12 w-12" />
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-black">
          Selamat Datang, {firstName}!
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xs text-sm leading-relaxed">
          Akun Anda telah disetujui oleh admin PKK {reg.kelurahan}. Mulai berkontribusi untuk aksi
          iklim bersama komunitas.
        </p>
        <Link
          href="/login"
          className="bg-brand flex w-full max-w-sm items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white"
        >
          Lanjut Masuk <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  if (reg.status === 'rejected') {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-black">Pendaftaran Belum Disetujui</h2>
        <p className="text-muted-foreground mb-6 max-w-xs text-sm leading-relaxed">
          {reg.rejectReason}
        </p>
        <div className="w-full max-w-sm">
          <ContactCard />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-white px-6 py-10 text-center">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-amber-100" />
          <span
            className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-500 motion-safe:animate-spin"
            aria-hidden
          />
          <Clock className="relative h-10 w-10 text-amber-600" />
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-black">Menunggu Persetujuan</h2>
        <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
          Email terverifikasi. Akun {reg.type === 'pkk' ? 'Anggota PKK' : 'Warga Umum'} Anda sedang
          ditinjau oleh admin PKK <span className="text-foreground font-bold">{reg.kelurahan}</span>{' '}
          dalam waktu 1x24 jam.
        </p>

        <div
          className={cn(
            'mb-4 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left',
            overdue ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
          )}
        >
          {overdue ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div>
            <p className={cn('text-sm font-black', overdue ? 'text-red-700' : 'text-amber-800')}>
              {overdue
                ? 'Melewati batas 1x24 jam'
                : `Batas persetujuan: ${formatRemaining(remaining)} lagi`}
            </p>
            <p className={cn('text-xs', overdue ? 'text-red-600' : 'text-amber-700')}>
              Anda akan diberi tahu lewat email {reg.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          aria-live="polite"
          className="mb-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 py-3.5 text-sm font-black text-slate-600"
        >
          <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /> Menunggu persetujuan admin
          PKK…
        </button>

        <ContactCard emphasis={overdue} />
        <Link href="/" className="text-brand mt-5 text-sm font-bold">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}