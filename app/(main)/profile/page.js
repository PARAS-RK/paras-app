'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, ShieldCheck, LogOut, Bell, Lock, FileText, Leaf, Award, Flame, Pencil, HelpCircle, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useReportContext } from '../../../context/ReportContext';
import { useAksiState, toggleHideName } from '../../../lib/aksiStore';
import { BadgeCollectionCard } from '../../../components/Badges';
import { createClient } from '../../../lib/supabase/client';

import EditProfileModal from '../../../components/profile/EditProfileModal';
import PasswordForm from '../../../components/profile/PasswordForm';
import { Toggle, Row } from '../../../components/profile/ProfileUI';

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const sectionLabel = 'px-5 pt-5 pb-2 text-xs font-black uppercase tracking-widest text-muted-foreground';

export default function Profile() {
  const router = useRouter();
  const [hash, setHash] = useState('');
  const { reports } = useReportContext();
  const [loadingUser, setLoadingUser] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userStats, setUserStats] = useState({ completed: 0, points: 0, streak: 0, activeJoined: 0 });
  const [profileData, setProfileData] = useState({
    full_name: 'Warga PARAS',
    email: '',
    phone: '',
    phone_number: '',
    avatar_url: '',
    kelurahan: '',
    kecamatan: '',
    city: '',
    province: '',
    rt: '',
    rw: '',
    pkkStatus: 'verified',
    pkkRole: 'PKK',
    joinedDate: 'September 2024',
  });

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data: dataProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*, regions(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dataProfile && !profileError) {
          setProfileData({
            full_name: dataProfile.full_name || user.user_metadata?.full_name || 'Warga PARAS',
            email: user.email || '',
            phone: dataProfile.phone_number || '',
            phone_number: dataProfile.phone_number || '',
            avatar_url: dataProfile.avatar_url || '',
            kelurahan: dataProfile.regions?.subdistrict || '',
            kecamatan: dataProfile.regions?.district || '',
            city: dataProfile.regions?.city || '',
            province: dataProfile.regions?.province || '',
            rt: dataProfile.rt || '',
            rw: dataProfile.rw || '',
            pkkStatus: dataProfile.account_status || 'verified',
            pkkRole: dataProfile.account_category || 'PKK',
            joinedDate: dataProfile.created_at
              ? new Date(dataProfile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
              : 'September 2024',
          });
        }

        // Ambil daftar partisipasi user & bukti foto valid agar sinkron dengan halaman Aksi
        const [{ data: partRecords }, { data: allProofs }] = await Promise.all([
          supabase.from('action_participants').select('*').eq('user_id', user.id),
          supabase.from('action_completion_proofs').select('participation_id, photo_path'),
        ]);

        const validProofPartIds = new Set(
          (allProofs || [])
            .filter((pr) => {
              const path = String(pr.photo_path || '').trim();
              return path.startsWith('data:image/') || path.startsWith('http://') || path.startsWith('https://');
            })
            .map((pr) => pr.participation_id)
        );

        const records = partRecords || [];
        const partIds = records.map((p) => p.participation_id).filter(Boolean);

        // 1. Hitung total poin murni dari checklist yang sudah selesai
        let taskPointsSum = 0;
        if (partIds.length > 0) {
          const { data: progData } = await supabase
            .from('action_task_progress')
            .select('participation_id, action_tasks(points)')
            .in('participation_id', partIds);

          if (progData && progData.length > 0) {
            taskPointsSum = progData.reduce((sum, item) => {
              const pts = item.action_tasks?.points ?? 10;
              return sum + pts;
            }, 0);
          }
        }

        // 2. Hitung jumlah aksi selesai & aksi aktif diikuti
        const completedRecords = records.filter((p) => {
          const st = String(p.completion_action_status || '').trim().toLowerCase();
          const hasValidProof = validProofPartIds.has(p.participation_id);
          return st === 'selesai' || st === 'done' || st === 'completed' || hasValidProof;
        });

        const completedCount = completedRecords.length;
        const activeJoinedCount = Math.max(records.length - completedCount, 0);

        const storedPoints = records.reduce((sum, r) => sum + (r.leaderboard_point || 0), 0);
        let userPoints = Math.max(taskPointsSum, storedPoints);

        let userStreak =
          completedCount > 0
            ? Math.max(...completedRecords.map((r) => r.streak_action || 1), 1)
            : 0;

        if (dataProfile) {
          if ((dataProfile.points || 0) > userPoints) userPoints = dataProfile.points;
          if ((dataProfile.streak || 0) > userStreak) userStreak = dataProfile.streak;
        }

        setUserStats({
          completed: completedCount,
          points: userPoints,
          streak: userStreak,
          activeJoined: activeJoinedCount,
        });
      } catch (err) {
        console.error('Gagal mengambil data:', err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchProfileAndStats();
  }, [router]);

  useEffect(() => {
    setHash(window.location.hash);
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const aksi = useAksiState();
  const [notif, setNotif] = useState({ cuaca: true, laporan: true, aksi: true, wa: false });
  const [openPwd, setOpenPwd] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const handleDeleteAccount = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus akun?')) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').delete().eq('user_id', user.id);
        await supabase.auth.signOut();
        localStorage.removeItem('paras-authenticated');
        router.push('/');
      }
    }
  };

  const mine = reports.filter((r) => r.reporter === profileData.full_name);
  const inProgress = mine.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;

  const stats = [
    { icon: FileText, value: mine.length, label: 'Laporan dikirim', sub: `${inProgress} diproses`, to: '/reports' },
    { icon: Leaf, value: userStats.completed, label: 'Aksi selesai', sub: `${userStats.activeJoined} diikuti`, to: '/aksi' },
    { icon: Award, value: userStats.points, label: 'Poin', sub: 'Level Tunas', to: '/aksi?seg=peringkat' },
    { icon: Flame, value: userStats.streak, label: 'Minggu beruntun', sub: 'Pertahankan!', to: '/aksi?seg=peringkat' },
  ];

  const notifItems = [
    { k: 'cuaca', t: 'Peringatan cuaca & bencana', s: `Untuk ${profileData.kelurahan || 'Kelurahan'}, ${profileData.city || 'Kota'}` },
    { k: 'laporan', t: 'Perkembangan laporan', s: 'Saat status laporan berubah' },
    { k: 'aksi', t: 'Aksi Komunitas', s: 'Aksi baru & verifikasi bukti' },
    { k: 'wa', t: 'Kirim juga lewat WhatsApp', s: profileData.phone || profileData.phone_number || '-' },
  ];

  const getInitials = (name) => (name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'WJ');

  if (loadingUser) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-10 lg:py-8">
      <h1 className="sr-only">Profil</h1>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:items-start">
        <div className="space-y-5 lg:sticky lg:top-24">
          <section className={cn(card, 'overflow-hidden')}>
            <div className="bg-brand px-5 pb-14 pt-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Profil Saya</p>
            </div>
            <div className="-mt-10 px-5 pb-5">
              <div className="flex items-end justify-between">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt="Foto Profil" className="h-20 w-20 rounded-full border-4 border-white object-cover shadow" />
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
                  <Pencil className="h-4 w-4" /> Ubah Profil
                </button>
              </div>
              <p className="mt-3 text-xl font-black text-foreground">{profileData.full_name}</p>
              {profileData.pkkStatus === 'verified' && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
                  <ShieldCheck className="h-3.5 w-3.5" /> {profileData.pkkRole} Terverifikasi
                </span>
              )}
              <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {profileData.kelurahan
                  ? `${profileData.kelurahan}, ${profileData.kecamatan}, ${profileData.city} (RT ${profileData.rt || '-'}/RW ${profileData.rw || '-'})`
                  : 'Atur lokasi domisili'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Bergabung sejak {profileData.joinedDate}</p>
            </div>
            <div className="border-t border-border">
              <Row icon={Mail} title="Email" sub={profileData.email} />
              <Row icon={Phone} title="Nomor HP" sub={profileData.phone || profileData.phone_number || '-'} />
            </div>
          </section>
          <BadgeCollectionCard points={userStats.points} className={cn(card, 'pb-4')} headingClassName={sectionLabel} />
        </div>

        <div className="space-y-5">
          <section>
            <h2 className="mb-3 text-lg font-black text-foreground">Aktivitas Saya</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <Link key={s.label} href={s.to} className={cn(card, 'group p-4 transition-shadow hover:shadow-md')}>
                  <s.icon className="h-5 w-5 text-brand" />
                  <p className="mt-2 text-2xl font-black text-foreground">{s.value}</p>
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className={sectionLabel}>Pengaturan</h2>
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
            <Row icon={EyeOff} title="Sembunyikan nama di Peringkat" sub="Hanya inisial yang terlihat" right={<Toggle label="Sembunyikan nama" on={aksi.hideName} onChange={toggleHideName} />} />
          </section>

          <section className={card}>
            <h2 className={sectionLabel}>Bantuan & Keamanan Akun</h2>
            <Row icon={HelpCircle} title="Pusat Bantuan" sub="Panduan memakai PARAS" onClick={() => router.push('/chatbot')} />
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                localStorage.removeItem('paras-authenticated');
                router.push('/');
              }}
              className="flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left hover:bg-muted/60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <LogOut className="h-5 w-5 text-foreground/70" />
              </span>
              <span className="text-[15px] font-bold">Keluar dari Akun</span>
            </button>
            <button onClick={handleDeleteAccount} className="flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left text-red-600 hover:bg-red-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <Trash2 className="h-5 w-5 text-red-600" />
              </span>
              <span className="text-[15px] font-bold">Hapus Akun</span>
            </button>
          </section>
        </div>
      </div>

      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} currentProfile={profileData} onSuccess={(updated) => setProfileData((prev) => ({ ...prev, ...updated }))} />
    </div>
  );
}