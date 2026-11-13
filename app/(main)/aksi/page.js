'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Flame, Leaf, CheckCircle2, MapPin, Users, Inbox, Info, Check, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { pct, initialsOf } from '../../../lib/aksiStore';
import { BadgeIcon, BadgeProgressCard, BadgeUnlockedDialog, badgeForPoints, badgeProgress, demoUnlockBadge } from '../../../components/Badges';
import { StatusBadge, CategoryArt, ProgressBar, JoinModal, ToastHost, showToast, Sheet, btnPrimary, btnSecondary, focusRing, fontWrap } from '../../../components/AksiShared';
import { createClient } from '../../../lib/supabase/client';

function AksiListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const seg = searchParams.get('seg') === 'peringkat' ? 'peringkat' : 'aksi';

  const setSeg = (v) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === 'aksi') {
      params.delete('seg');
    } else {
      params.set('seg', v);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const [loading, setLoading] = useState(true);
  const [aksiList, setAksiList] = useState([]);
  const [userStats, setUserStats] = useState({ streak: 0, points: 0, completed: 0, hideName: false });
  const [userRegion, setUserRegion] = useState('Bandung, Jawa Barat');
  const [rankings, setRankings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        let userPoints = 0;
        let userStreak = 0;
        let completedCount = 0;
        let hideNameVal = false;
        let activeRegionId = null;
        let activeRegionName = 'Bandung, Jawa Barat';

        // Fungsi hitung poin murni berdasarkan checklist yang selesai
        const calculateUserStats = async (userId, partRecords, proofParticipationIds) => {
          const userParts = (partRecords || []).filter((p) => p.user_id === userId);
          if (userParts.length === 0) return { points: 0, completedCount: 0, streak: 0 };

          const partIds = userParts.map((p) => p.participation_id).filter(Boolean);

          // 1. Hitung total poin dari checklist tugas yang sudah dicentang
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

          // 2. Hitung aksi yang sudah selesai (status 'selesai' atau sudah unggah bukti valid)
          const completedRecords = userParts.filter((p) => {
            const st = String(p.completion_action_status || '').trim().toLowerCase();
            const hasValidProof = proofParticipationIds.has(p.participation_id);
            return st === 'selesai' || st === 'done' || st === 'completed' || hasValidProof;
          });

          const selesaiCount = completedRecords.length;

          const storedPoints = userParts.reduce((sum, r) => sum + (r.leaderboard_point || 0), 0);
          const totalPoints = Math.max(taskPointsSum, storedPoints);

          const streakVal =
            selesaiCount > 0
              ? Math.max(...completedRecords.map((r) => r.streak_action || 1), 1)
              : 0;

          return { points: totalPoints, completedCount: selesaiCount, streak: streakVal };
        };

        // Ambil daftar participation_id yang sudah punya bukti foto valid
        const { data: allProofs } = await supabase
          .from('action_completion_proofs')
          .select('participation_id, photo_path');

        const validProofPartIds = new Set(
          (allProofs || [])
            .filter((pr) => {
              const path = String(pr.photo_path || '').trim();
              return path.startsWith('data:image/') || path.startsWith('http://') || path.startsWith('https://');
            })
            .map((pr) => pr.participation_id)
        );

        if (user) {
          // 1. Ambil profil user beserta relasi regions
          const { data: profileData, error: profErr } = await supabase
            .from('profiles')
            .select('*, regions(*)')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profErr) console.error('Error profil:', profErr.message);

          if (profileData) {
            hideNameVal = profileData.hide_name || false;
            activeRegionId = profileData.region_id || null;

            if (profileData.regions) {
              const { subdistrict, district, city } = profileData.regions;
              const formatted = [subdistrict, district, city].filter(Boolean).join(', ');
              if (formatted) activeRegionName = formatted;
            }
          }

          setUserRegion(activeRegionName);

          // 2. Ambil catatan partisipasi user & hitung poin riilnya
          const { data: myPartRecords, error: partErr } = await supabase
            .from('action_participants')
            .select('*')
            .eq('user_id', user.id);

          if (partErr) console.error('Error partisipasi:', partErr.message);

          const myStats = await calculateUserStats(user.id, myPartRecords, validProofPartIds);
          userPoints = myStats.points;
          completedCount = myStats.completedCount;
          userStreak = myStats.streak;

          setUserStats({
            streak: userStreak,
            points: userPoints,
            completed: completedCount,
            hideName: hideNameVal,
          });
        }

        // 3. Ambil data aksi dari tabel community_actions
        const { data: actionsData, error: actionsError } = await supabase
          .from('community_actions')
          .select('*')
          .order('created_at', { ascending: false });

        if (actionsError) throw actionsError;

        const formattedAksi = await Promise.all(
          (actionsData || []).map(async (item) => {
            const { count: participantCount } = await supabase
              .from('action_participants')
              .select('*', { count: 'exact', head: true })
              .eq('action_id', item.action_id);

            let userStatus = null;

            if (user) {
              const { data: partData } = await supabase
                .from('action_participants')
                .select('participation_id, completion_action_status')
                .eq('user_id', user.id)
                .eq('action_id', item.action_id)
                .maybeSingle();

              if (partData) {
                userStatus = partData.completion_action_status;
                if (validProofPartIds.has(partData.participation_id)) {
                  userStatus = 'selesai';
                }
              }
            }

            const isSelesai = userStatus && String(userStatus).trim().toLowerCase() === 'selesai';

            return {
              id: item.action_id,
              title: item.action_title,
              objective: item.action_description || 'Aksi peduli lingkungan sekitar.',
              category: 'lingkungan',
              location: activeRegionName,
              status: isSelesai ? 'selesai' : 'aktif',
              startDate: item.action_start_date || 'Segera',
              target: 100,
              achieved: participantCount || 0,
              unit: 'peserta',
              participants: participantCount || 0,
              quota: 50,
              joined: userStatus !== null,
              userStatus: userStatus,
            };
          })
        );

        setAksiList(formattedAksi);

        // 4. Ambil daftar warga di wilayah yang sama (filter berdasarkan region_id)
        let profilesQuery = supabase.from('profiles').select('*');
        if (activeRegionId) {
          profilesQuery = profilesQuery.eq('region_id', activeRegionId);
        }

        const { data: regionProfiles, error: regProfErr } = await profilesQuery.limit(50);
        if (regProfErr) console.error('Error daftar warga wilayah:', regProfErr.message);

        if (regionProfiles && regionProfiles.length > 0) {
          const regionUserIds = regionProfiles.map((p) => p.user_id).filter(Boolean);

          const { data: regionParticipants } = await supabase
            .from('action_participants')
            .select('*')
            .in('user_id', regionUserIds);

          const computedRankings = await Promise.all(
            regionProfiles.map(async (r) => {
              const rId = r.user_id;
              const isMe = user ? rId === user.id : false;

              if (isMe) {
                return {
                  id: rId,
                  name: r.full_name || 'Warga PARAS',
                  points: userPoints,
                  completedActions: completedCount,
                  hideName: hideNameVal,
                  me: true,
                };
              }

              const stats = await calculateUserStats(rId, regionParticipants, validProofPartIds);
              return {
                id: rId,
                name: r.full_name || 'Warga PARAS',
                points: Math.max(stats.points, r.points || 0),
                completedActions: stats.completedCount,
                hideName: r.hide_name || false,
                me: false,
              };
            })
          );

          computedRankings.sort((a, b) => b.points - a.points || b.completedActions - a.completedActions);
          setRankings(computedRankings);
        } else {
          setRankings([
            {
              id: user?.id || '1',
              name: user?.user_metadata?.full_name || 'Warga PARAS',
              points: userPoints,
              completedActions: completedCount,
              hideName: hideNameVal,
              me: true,
            },
          ]);
        }
      } catch (err) {
        console.error('Gagal memuat data dari Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fungsi toggle sembunyikan nama langsung ke Supabase
  const handleToggleHideName = async () => {
    const nextVal = !userStats.hideName;
    setUserStats((prev) => ({ ...prev, hideName: nextVal }));
    setRankings((prev) => prev.map((r) => (r.me ? { ...r, hideName: nextVal } : r)));

    if (currentUser) {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ hide_name: nextVal })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Gagal memperbarui pengaturan nama:', error);
        showToast({ msg: 'Gagal menyimpan pengaturan privasi nama.' });
      } else {
        showToast({ msg: nextVal ? 'Namamu sekarang ditampilkan sebagai inisial.' : 'Namamu kembali ditampilkan.' });
      }
    }
  };

  const chips = [
    { Icon: Flame, color: 'text-[#F97316]', label: `${userStats.streak} minggu beruntun` },
    { Icon: Leaf, color: 'text-[#159038]', label: `${userStats.points} Poin` },
    { Icon: CheckCircle2, color: 'text-[#0F6B2A]', label: `${userStats.completed} Aksi selesai` },
  ];

  return (
    <div className={cn('min-h-full bg-[#F8F9FA]', fontWrap)}>
      <div className="mx-auto max-w-[1100px] px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
        <h1 className="text-[28px] font-bold leading-tight lg:text-[32px]">Aksi Komunitas</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[#4B5563]">
          <MapPin className="h-4 w-4 text-[#159038]" aria-hidden /> Aksi di {userRegion}
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c.label} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 text-sm font-semibold shadow-sm">
              <c.Icon className={cn('h-4 w-4', c.color)} aria-hidden /> {c.label}
            </li>
          ))}
        </ul>

        <div role="tablist" aria-label="Pilih tampilan" className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#E5E7EB] p-1 lg:max-w-sm">
          {['aksi', 'peringkat'].map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={seg === v}
              onClick={() => setSeg(v)}
              className={cn('min-h-11 rounded-xl text-[15px] font-semibold transition-colors', focusRing, seg === v ? 'bg-white text-[#0F6B2A] shadow-sm' : 'text-[#374151] hover:bg-white/60')}
            >
              {v === 'aksi' ? 'Aksi' : 'Peringkat'}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {seg === 'aksi' ? (
            <AksiSegment list={aksiList} loading={loading} />
          ) : (
            <PeringkatSegment
              userStats={userStats}
              rankings={rankings}
              userRegion={userRegion}
              onToggleHideName={handleToggleHideName}
            />
          )}
        </div>
      </div>
      <ToastHost />
    </div>
  );
}

export default function AksiList() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center"><Loader2 className="animate-spin text-[#159038]" /></div>}>
      <AksiListContent />
    </Suspense>
  );
}

/* ───────── Segmen Aksi ───────── */
function AksiSegment({ list, loading }) {
  const router = useRouter();
  const [joinTarget, setJoinTarget] = useState(null);

  if (loading)
    return (
      <Grid>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </Grid>
    );

  if (list.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FDF2F8]">
          <Inbox className="h-10 w-10 text-[#E6008A]" aria-hidden />
        </div>
        <p className="mt-4 text-[15px] text-[#374151]">Belum ada aksi di wilayahmu. Nantikan ajakan dari Ketua PKK.</p>
      </div>
    );
  }

  return (
    <>
      <Grid>
        {list.map((a) => (
          <ActionCard key={a.id} a={a} onOpen={() => router.push(`/aksi/${a.id}`)} onJoin={() => setJoinTarget(a)} />
        ))}
      </Grid>
      {joinTarget && (
        <JoinModal
          aksi={joinTarget}
          onClose={() => setJoinTarget(null)}
          onConfirm={async () => {
            try {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                alert('Silakan login terlebih dahulu.');
                return;
              }

              const { data: taskData } = await supabase
                .from('action_tasks')
                .select('action_task_id')
                .eq('action_id', joinTarget.id)
                .limit(1)
                .maybeSingle();

              const stepId = taskData ? taskData.action_task_id : 1;

              const { error } = await supabase.from('action_participants').insert({
                user_id: user.id,
                action_id: joinTarget.id,
                joined_at: new Date().toISOString(),
                completion_action_status: 'terdaftar',
                action_step_id: stepId,
                leaderboard_point: 0,
                streak_action: 0,
              });

              if (error) throw error;

              setJoinTarget(null);
              showToast({ msg: 'Kamu sudah bergabung ke aksi ini!' });
              window.location.reload();
            } catch (err) {
              alert('Gagal bergabung: ' + err.message);
            }
          }}
        />
      )}
    </>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">{children}</div>;
}

function SkeletonCard() {
  return (
    <div className="flex h-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm" aria-hidden>
      <div className="h-32 animate-pulse bg-[#E5E7EB]" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#F3F4F6]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#F3F4F6]" />
        <div className="h-8 animate-pulse rounded bg-[#F3F4F6]" />
        <div className="mt-auto h-12 animate-pulse rounded-xl bg-[#E5E7EB]" />
      </div>
    </div>
  );
}

function ActionCard({ a, onOpen, onJoin }) {
  const p = pct(a.participants, a.quota);
  const isCompleted = a.userStatus && String(a.userStatus).trim().toLowerCase() === 'selesai';

  return (
    <article
      onClick={onOpen}
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E6008A]/10 bg-white shadow-[0_1px_3px_rgba(17,24,39,0.08)] transition-shadow hover:border-[#E6008A]/40 hover:shadow-md"
    >
      <div className="relative">
        <CategoryArt category={a.category} className="h-32" />
        <div className="absolute right-3 top-3">
          <StatusBadge status={isCompleted ? 'selesai' : a.status} />
        </div>
        {a.status === 'akan-datang' && <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-2 py-1 text-sm font-semibold">Mulai {a.startDate}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug">
          <Link href={`/aksi/${a.id}`} onClick={(e) => e.stopPropagation()} className={cn('rounded hover:text-[#0F6B2A]', focusRing)}>
            {a.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[#4B5563]">{a.objective}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#374151]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-[#159038]" aria-hidden />
            {a.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4 text-[#159038]" aria-hidden />
            {a.participants}/{a.quota} peserta
          </span>
        </p>
        <div className="mt-4">
          <ProgressBar value={p} label="Progres partisipasi peserta" />
          <p className="mt-1.5 text-sm text-[#374151]">
            {a.participants} dari {a.quota} peserta
          </p>
        </div>
        <div className="mt-auto pt-4">
          {isCompleted ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className={cn(btnSecondary, 'w-full border-[#159038] text-[#159038] hover:bg-[#ECFDF5]')}
            >
              Aksi Selesai
            </button>
          ) : a.joined ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className={cn(btnPrimary, 'w-full')}
            >
              Lanjutkan
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className={cn(btnPrimary, 'w-full')}
            >
              Ikut Sekarang
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ───────── Segmen Peringkat ───────── */
function PeringkatSegment({ userStats, rankings, userRegion, onToggleHideName }) {
  const [help, setHelp] = useState(false);
  const { next } = badgeProgress(userStats.points);
  const top = rankings.slice(0, 10);
  const myIndex = rankings.findIndex((r) => r.me);
  const noPoints = rankings.every((r) => r.points === 0);
  const weeks = [true, true, true, false];

  const RankRow = ({ r, i }) => {
    const shouldHide = r.me ? userStats.hideName : r.hideName;
    const displayName = shouldHide ? initialsOf(r.name) : r.name;
    const badge = badgeForPoints(r.points);

    return (
      <li className={cn('flex min-h-14 items-center gap-3 px-4 py-2', r.me && 'bg-[#ECFDF5]')}>
        <span className="w-6 shrink-0 text-center text-sm font-semibold text-[#6B7280]" aria-label={`Peringkat ${i + 1}`}>
          {i + 1}
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          {badge && (
            <span role="img" aria-label={`Lencana: ${badge.name}`} title={badge.name} className="inline-flex">
              <BadgeIcon badge={badge} size={16} className="scale-125" />
            </span>
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 text-[15px] font-bold">
            <span className="truncate">{displayName}</span>
            {r.me && <span className="rounded-full bg-[#0F6B2A] px-2 py-0.5 text-xs font-bold text-white">Kamu</span>}
          </span>
          <span className="text-xs text-[#6B7280]">{r.completedActions || 0} aksi selesai</span>
        </div>
        <span className="shrink-0 text-[15px] font-bold text-[#111827]">{r.points} Poin</span>
      </li>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <BadgeProgressCard points={userStats.points} />
        <button onClick={() => setHelp(true)} className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-[#0F6B2A] underline-offset-4 hover:underline', focusRing)}>
          <Info className="h-4 w-4" aria-hidden /> Bagaimana cara kerjanya?
        </button>

        <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <Flame className="h-8 w-8 shrink-0 text-[#F97316]" aria-hidden />
          <div className="flex-1">
            <p className="font-bold">{userStats.streak} minggu beruntun</p>
            <ul className="mt-2 flex gap-2" aria-label="4 minggu terakhir">
              {weeks.map((ok, i) => (
                <li
                  key={i}
                  className={cn('flex h-9 w-9 items-center justify-center rounded-full', ok ? 'bg-[#159038] text-white' : 'border-2 border-dashed border-[#9CA3AF] text-[#6B7280]')}
                  aria-label={ok ? `Minggu ${i + 1}: berhasil` : 'Minggu ini: belum'}
                >
                  {ok ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">Ini</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <button onClick={() => demoUnlockBadge(userStats.points)} disabled={!next} className={cn('min-h-11 rounded-lg border border-dashed border-[#D1D5DB] px-3 text-xs font-semibold text-[#6B7280] hover:bg-white disabled:opacity-50', focusRing)}>
          Demo: buka lencana
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#4B5563]">
          <span>Peringkat Wilayah ({userRegion})</span>
          <span>Poin</span>
        </div>
        {noPoints ? (
          <p className="px-4 py-10 text-center text-[15px] text-[#374151]">Belum ada poin minggu ini di wilayahmu. Ayo ikut aksi pertamamu!</p>
        ) : (
          <>
            <ol className="divide-y divide-[#F3F4F6]">
              {top.map((r, i) => (
                <RankRow key={r.id} r={r} i={i} />
              ))}
            </ol>
            {myIndex >= 10 && (
              <ol className="sticky bottom-0 border-t-2 border-[#159038]/30">
                <RankRow r={rankings[myIndex]} i={myIndex} />
              </ol>
            )}
          </>
        )}
        <div className="border-t border-[#E5E7EB] px-4 py-2">
          <button onClick={onToggleHideName} className={cn('min-h-11 rounded-lg text-sm font-semibold text-[#0F6B2A] underline-offset-4 hover:underline', focusRing)}>
            {userStats.hideName ? 'Tampilkan nama saya' : 'Sembunyikan nama saya (tampil sebagai inisial)'}
          </button>
        </div>
      </section>

      {help && (
        <Sheet title="Cara kerja poin" onClose={() => setHelp(false)}>
          <h2 className="text-xl font-bold">Bagaimana cara kerjanya?</h2>
          <ol className="mt-4 space-y-3 text-[15px]">
            {[
              '+10 poin untuk setiap tugas/checklist yang diselesaikan.',
              'Peringkat hanya untuk anggota di wilayahmu dan direset tiap Senin.',
              'Streak naik jika ada minimal 1 tugas disetujui dalam seminggu.',
              'Lencana terbuka otomatis dari total poin: Penjaga Hijau (50), Penggerak Warga (100), dan Pelopor Aksi (120).',
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#159038] text-sm font-bold text-white">{i + 1}</span>
                <span className="pt-1">{t}</span>
              </li>
            ))}
          </ol>
          <button onClick={() => setHelp(false)} className={cn(btnSecondary, 'mt-5 w-full')}>
            Mengerti
          </button>
        </Sheet>
      )}
      <BadgeUnlockedDialog points={userStats.points} />
    </div>
  );
}