'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, ShieldCheck, ChevronRight, ChevronDown, LogOut, Bell, Lock, FileText, Leaf, Award, Flame, Pencil, HelpCircle, EyeOff, Check, UserCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { currentUser, displayName, addressFull, areaLabel } from '@/lib/currentUser';
import { useReportContext } from '@/context/ReportContext';
import { useAksiState, toggleHideName } from '@/app/(main)/aksi/aksiStore';
import { BadgeCollectionCard } from '@/app/(main)/badges/Badges';

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const sectionLabel = 'px-5 pt-5 pb-2 text-xs font-black uppercase tracking-widest text-muted-foreground';

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
        on ? 'bg-brand' : 'bg-gray-300',
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

  const mine = reports.filter((r) => r.reporter === displayName);
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
    { k: 'wa', t: 'Kirim juga lewat WhatsApp', s: currentUser.phone },
  ];

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
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-brand-light text-2xl font-black text-brand shadow">{currentUser.initials}</span>
                <button className="mb-1 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-muted">
                  <Pencil className="h-4 w-4" aria-hidden /> Ubah Profil
                </button>
              </div>
              <p className="mt-3 text-xl font-black text-foreground">{displayName}</p>
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
              <Row icon={Mail} title="Email" sub={currentUser.email} />
              <Row icon={Phone} title="Nomor HP" sub={currentUser.phone} />
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
              onClick={() => {
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
    </div>
  );
}
