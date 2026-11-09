'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, ShieldCheck, ChevronRight, ChevronDown, LogOut, Bell, Lock, FileText, Leaf, Award, Flame, Pencil, HelpCircle, EyeOff, Check, UserCheck, Trash2, X, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { currentUser, displayName, addressFull, areaLabel } from '@/lib/currentUser';
import { useReportContext } from '@/context/ReportContext';
import { useAksiState, toggleHideName } from '@/app/(main)/aksi/aksiStore';
import { BadgeCollectionCard } from '@/app/(main)/badges/Badges';
import { createClient } from '@/lib/supabase/client';

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const sectionLabel = 'px-5 pt-5 pb-2 text-xs font-black uppercase tracking-widest text-muted-foreground';

/* Modal Ubah Profil Lengkap */
function EditProfileModal({ isOpen, onClose, currentProfile, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.full_name || '');
      setPhone(currentProfile.phone || '');
      setEmail(currentProfile.email || '');
      setAvatarUrl(currentProfile.avatar_url || '');
      setPreviewUrl(currentProfile.avatar_url || '');
      setAvatarFile(null);
    }
  }, [currentProfile]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran foto maksimal 2MB.');
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Pengguna tidak terautentikasi.');
      }

      let uploadedAvatarUrl = avatarUrl;

      // 1. Upload foto ke Supabase Storage (bucket: avatars) jika ada file baru dipilih
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        uploadedAvatarUrl = publicUrlData.publicUrl;
      }

      // 2. Update metadata profile & tabel profiles di Supabase
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          phone: phone,
          avatar_url: uploadedAvatarUrl,
        })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      // 3. Update Email Auth jika user mengubah emailnya
      if (email !== currentProfile.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
      }

      // Callback sukses ke UI lokal
      if (onSuccess) {
        onSuccess({
          full_name: name,
          phone: phone,
          email: email,
          avatar_url: uploadedAvatarUrl,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (text) => {
    if (!text) return 'SW';
    return text.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-lg font-black text-foreground">Ubah Profil</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-500">{errorMsg}</p>}

          {/* Input Upload Foto Profil */}
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover border-4 border-brand-light shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-brand-light bg-brand-light text-2xl font-black text-brand shadow-sm">
                  {getInitials(name)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow hover:bg-brand-dark"
                title="Ganti Foto"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-[11px] text-muted-foreground">Format JPG/PNG, maks 2MB</p>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {/* Nomor HP */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">Nomor HP</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-black text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      role="switch"
      type="button"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        on ? 'bg-brand' : 'bg-gray-300'
      )}
    >
      <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out', on ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  );
}

function Row({ icon: Icon, title, sub, right, onClick, expanded }) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-foreground/70" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-foreground">{title}</span>
        {sub && <span className="block text-sm text-muted-foreground">{sub}</span>}
      </span>
      {right ??
        (onClick &&
          (expanded === undefined ? <ChevronRight className="h-5 w-5 text-muted-foreground/60" aria-hidden /> : <ChevronDown className={cn('h-5 w-5 text-muted-foreground/60 transition-transform', expanded && 'rotate-180')} aria-hidden />))}
    </>
  );
  const cls = 'flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left';
  return onClick ? (
    <button onClick={onClick} aria-expanded={expanded} className={cn(cls, 'hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none')}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function PasswordForm({ onDone }) {
  const [f, setF] = useState({ old: '', next: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const err = f.next && f.next.length < 8 ? 'Minimal 8 karakter.' : f.confirm && f.confirm !== f.next ? 'Konfirmasi tidak sama.' : null;
  const ok = f.old && f.next.length >= 8 && f.next === f.confirm;
  const input = 'mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

  return (
    <form
      className="space-y-3 border-t border-border bg-muted/30 px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        setMsg('Kata sandi berhasil diperbarui.');
        setF({ old: '', next: '', confirm: '' });
        setTimeout(onDone, 1200);
      }}
    >
      {[
        ['old', 'Kata sandi saat ini'],
        ['next', 'Kata sandi baru'],
        ['confirm', 'Ulangi kata sandi baru'],
      ].map(([k, l]) => (
        <label key={k} className="block text-sm font-semibold text-foreground">
          {l}
          <input type="password" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={input} autoComplete={k === 'old' ? 'current-password' : 'new-password'} />
        </label>
      ))}
      {err && (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      )}
      {msg && (
        <p className="flex items-center gap-1.5 text-sm font-bold text-brand" role="status">
          <Check className="h-4 w-4" aria-hidden />
          {msg}
        </p>
      )}
      <button disabled={!ok} className="w-full rounded-xl bg-brand py-3 text-sm font-black text-white disabled:opacity-40">
        Simpan Kata Sandi
      </button>
    </form>
  );
}

export default function Profile() {
  const router = useRouter();
  const [hash, setHash] = useState('');
  const { reports } = useReportContext();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: displayName,
    email: currentUser.email,
    phone: currentUser.phone,
    avatar_url: '',
    kelurahan: currentUser.kelurahan || '',
    kecamatan: currentUser.kecamatan || '',
    city: currentUser.city || '',
  });

  // Fetch profil dari Supabase saat load awal
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            setProfileData((prev) => ({
              ...prev,
              full_name: data.full_name || prev.full_name,
              phone: data.phone || prev.phone,
              email: user.email || prev.email,
              avatar_url: data.avatar_url || '',
              kelurahan: data.kelurahan || prev.kelurahan,
              kecamatan: data.kecamatan || prev.kecamatan,
              city: data.city || prev.city,
            }));
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data profil:', err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    setHash(window.location.hash);
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (hash !== '#koleksi-lencana') return;
    const t = setTimeout(() => document.getElementById('koleksi-lencana')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    return () => clearTimeout(t);
  }, [hash]);

  const aksi = useAksiState();
  const [notif, setNotif] = useState({ cuaca: true, laporan: true, aksi: true, wa: false });
  const [openPwd, setOpenPwd] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const handleDeleteAccount = () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.');
    if (confirmed) {
      localStorage.removeItem('paras-authenticated');
      router.push('/');
    }
  };

  const mine = reports.filter((r) => r.reporter === profileData.full_name);
  const inProgress = mine.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;
  const joinedNow = aksi.aksi.filter((a) => a.joined && a.status !== 'selesai').length;

  const stats = [
    { icon: FileText, value: mine.length, label: 'Laporan dikirim', sub: `${inProgress} sedang diproses`, to: '/reports' },
    { icon: Leaf, value: aksi.completed, label: 'Aksi selesai', sub: `${joinedNow} sedang diikuti`, to: '/aksi' },
    { icon: Award, value: aksi.points, label: 'Poin', sub: 'Level Tunas', to: '/aksi?seg=peringkat' },
    { icon: Flame, value: aksi.streak, label: 'Minggu beruntun', sub: 'Pertahankan!', to: '/aksi?seg=peringkat' },
  ];

  const notifItems = [
    { k: 'cuaca', t: 'Peringatan cuaca & bencana', s: `Untuk ${areaLabel}` },
    { k: 'laporan', t: 'Perkembangan laporan', s: 'Saat status laporan berubah' },
    { k: 'aksi', t: 'Aksi Komunitas', s: 'Aksi baru & verifikasi bukti' },
    { k: 'wa', t: 'Kirim juga lewat WhatsApp', s: profileData.phone },
  ];

  const getInitials = (name) => {
    if (!name) return 'SW';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-10 lg:py-8">
      <h1 className="sr-only">Profil</h1>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:items-start">
        {/* Identity */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <section className={cn(card, 'overflow-hidden')}>
            <div className="bg-brand px-5 pb-14 pt-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Profil Saya</p>
            </div>
            <div className="-mt-10 px-5 pb-5">
              <div className="flex items-end justify-between">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Foto Profil"
                    className="h-20 w-20 rounded-full border-4 border-white object-cover shadow"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-brand-light text-2xl font-black text-brand shadow">
                    {getInitials(profileData.full_name)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="mb-1 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Pencil className="h-4 w-4" aria-hidden /> Ubah Profil
                </button>
              </div>
              <p className="mt-3 text-xl font-black text-foreground">{profileData.full_name}</p>
              {currentUser.pkkStatus === 'verified' && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> {currentUser.pkkRole} Terverifikasi
                </span>
              )}
              <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                {addressFull}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Bergabung sejak {currentUser.joinedDate}</p>
            </div>
            <div className="border-t border-border">
              <Row icon={Mail} title="Email" sub={profileData.email} />
              <Row icon={Phone} title="Nomor HP" sub={profileData.phone} />
            </div>
          </section>

          {/* Badge collection */}
          <BadgeCollectionCard className={cn(card, 'pb-4')} headingClassName={sectionLabel} />
        </div>

        <div className="space-y-5">
          {/* Activity */}
          <section aria-labelledby="act-h">
            <h2 id="act-h" className="mb-3 text-lg font-black text-foreground">
              Aktivitas Saya
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <Link key={s.label} href={s.to} className={cn(card, 'group p-4 transition-shadow hover:shadow-md')}>
                  <s.icon className="h-5 w-5 text-brand" aria-hidden />
                  <p className="mt-2 text-2xl font-black text-foreground">{s.value}</p>
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Settings */}
          <section className={card} aria-labelledby="set-h">
            <h2 id="set-h" className={sectionLabel}>
              Pengaturan
            </h2>
            <Row icon={Bell} title="Notifikasi" sub={`${Object.values(notif).filter(Boolean).length} dari 4 aktif`} onClick={() => setOpenNotif(!openNotif)} expanded={openNotif} />
            {openNotif && (
              <div className="border-t border-border bg-muted/30">
                {notifItems.map((n) => (
                  <div key={n.k} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-foreground">{n.t}</p>
                      <p className="text-sm text-muted-foreground">{n.s}</p>
                    </div>
                    <Toggle label={n.t} on={notif[n.k]} onChange={() => setNotif({ ...notif, [n.k]: !notif[n.k] })} />
                  </div>
                ))}
              </div>
            )}
            <Row icon={Lock} title="Ubah Kata Sandi" sub="Perbarui keamanan akun" onClick={() => setOpenPwd(!openPwd)} expanded={openPwd} />
            {openPwd && <PasswordForm onDone={() => setOpenPwd(false)} />}
            <Row icon={EyeOff} title="Sembunyikan nama di Peringkat" sub="Hanya inisial yang terlihat oleh warga lain" right={<Toggle label="Sembunyikan nama di Peringkat" on={aksi.hideName} onChange={toggleHideName} />} />
            <div className="pb-1" />
          </section>

          {/* Help, Logout & Delete Account */}
          <section className={card}>
            <h2 className={sectionLabel}>Bantuan & Keamanan Akun</h2>
            <Row icon={HelpCircle} title="Pusat Bantuan" sub="Panduan memakai PARAS" onClick={() => router.push('/chatbot')} />

            {/* Logout */}
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                localStorage.removeItem('paras-authenticated');
                router.push('/');
              }}
              className="flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left text-foreground hover:bg-muted/60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <LogOut className="h-5 w-5 text-foreground/70" aria-hidden />
              </span>
              <span className="text-[15px] font-bold">Keluar dari Akun</span>
            </button>

            {/* Delete Account */}
            <button onClick={handleDeleteAccount} className="flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left text-red-600 hover:bg-red-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <Trash2 className="h-5 w-5 text-red-600" aria-hidden />
              </span>
              <span className="text-[15px] font-bold">Hapus Akun</span>
            </button>
          </section>

          <p className="text-center text-xs text-muted-foreground/70">PARAS v1.0 · Platform Perempuan untuk Aksi Iklim</p>
        </div>
      </div>

      {/* Pop-up Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentProfile={profileData}
        onSuccess={(updated) => setProfileData((prev) => ({ ...prev, ...updated }))}
      />
    </div>
  );
}