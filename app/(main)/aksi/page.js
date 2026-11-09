'use client';

import { shortName } from '../../../lib/currentUser';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Flame, Leaf, CheckCircle2, MapPin, Users, Inbox, Info, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAksiState, joinAksi, pct, ranking, toggleHideName, initialsOf, USER_AREA } from './aksiStore';
import { BadgeIcon, BadgeProgressCard, BadgeUnlockedDialog, badgeForPoints, badgeProgress, demoUnlockBadge } from '../badges/Badges';
import { StatusBadge, CategoryArt, ProgressBar, JoinModal, ToastHost, showToast, Sheet, btnPrimary, btnSecondary, focusRing, fontWrap } from './AksiShared';

function AksiListContent() {
  const s = useAksiState();
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
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const chips = [
    { Icon: Flame, color: 'text-[#F97316]', label: `${s.streak} minggu beruntun` },
    { Icon: Leaf, color: 'text-[#159038]', label: `${s.points} Poin` },
    { Icon: CheckCircle2, color: 'text-[#0F6B2A]', label: `${s.completed} Aksi selesai` },
  ];

  return (
    <div className={cn('min-h-full bg-[#F8F9FA]', fontWrap)}>
      <div className="mx-auto max-w-[1100px] px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
        <h1 className="text-[28px] font-bold leading-tight lg:text-[32px]">Aksi Komunitas</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[#4B5563]">
          <MapPin className="h-4 w-4 text-[#159038]" aria-hidden /> Aksi di {USER_AREA}
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

        <div className="mt-5">{seg === 'aksi' ? <AksiSegment list={s.aksi} loading={loading} /> : <PeringkatSegment />}</div>
      </div>
      <ToastHost />
    </div>
  );
}

export default function AksiList() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA]" />}>
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
          onConfirm={() => {
            joinAksi(joinTarget.id);
            setJoinTarget(null);
            showToast({ msg: 'Kamu sudah bergabung' });
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
  const p = pct(a.achieved, a.target);
  return (
    <article
      onClick={onOpen}
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E6008A]/10 bg-white shadow-[0_1px_3px_rgba(17,24,39,0.08)] transition-shadow hover:border-[#E6008A]/40 hover:shadow-md"
    >
      <div className="relative">
        <CategoryArt category={a.category} className="h-32" />
        <div className="absolute right-3 top-3">
          <StatusBadge status={a.status} />
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
          <ProgressBar value={p} label="Progres komunitas" />
          <p className="mt-1.5 text-sm text-[#374151]">
            {a.achieved} dari {a.target} {a.unit}
          </p>
        </div>
        <div className="mt-auto pt-4">
          {a.joined ? (
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
function PeringkatSegment() {
  const s = useAksiState();
  const [help, setHelp] = useState(false);
  const { next } = badgeProgress(s.points);
  const rows = ranking(s);
  const top = rows.slice(0, 10);
  const myIndex = rows.findIndex((r) => r.me);
  const noPoints = rows.every((r) => r.points === 0);
  const weeks = [true, true, true, false];
  const RankRow = ({ r, i }) => {
    const name = r.me ? (s.hideName ? initialsOf(shortName) : shortName) : r.name;
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
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-bold">
          <span className="truncate">{name}</span>
          {r.me && <span className="rounded-full bg-[#0F6B2A] px-2 py-0.5 text-xs font-bold text-white">Kamu</span>}
        </span>
        <span className="shrink-0 text-[15px] font-bold text-[#111827]">{r.points} Poin</span>
      </li>
    );
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <BadgeProgressCard />
        <button onClick={() => setHelp(true)} className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-[#0F6B2A] underline-offset-4 hover:underline', focusRing)}>
          <Info className="h-4 w-4" aria-hidden /> Bagaimana cara kerjanya?
        </button>

        <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <Flame className="h-8 w-8 shrink-0 text-[#F97316]" aria-hidden />
          <div className="flex-1">
            <p className="font-bold">{s.streak} minggu beruntun</p>
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

        <button onClick={() => demoUnlockBadge(s.points)} disabled={!next} className={cn('min-h-11 rounded-lg border border-dashed border-[#D1D5DB] px-3 text-xs font-semibold text-[#6B7280] hover:bg-white disabled:opacity-50', focusRing)}>
          Demo: buka lencana
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex justify-between border-b border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#4B5563]">
          <span>Peringkat</span>
          <span>Poin</span>
        </div>
        {noPoints ? (
          <p className="px-4 py-10 text-center text-[15px] text-[#374151]">Belum ada poin minggu ini. Ayo ikut aksi pertamamu!</p>
        ) : (
          <>
            <ol className="divide-y divide-[#F3F4F6]">
              {top.map((r, i) => (
                <RankRow key={r.id} r={r} i={i} />
              ))}
            </ol>
            {myIndex >= 10 && (
              <ol className="sticky bottom-0 border-t-2 border-[#159038]/30">
                <RankRow r={rows[myIndex]} i={myIndex} />
              </ol>
            )}
          </>
        )}
        <div className="border-t border-[#E5E7EB] px-4 py-2">
          <button onClick={toggleHideName} className={cn('min-h-11 rounded-lg text-sm font-semibold text-[#0F6B2A] underline-offset-4 hover:underline', focusRing)}>
            {s.hideName ? 'Tampilkan nama saya' : 'Sembunyikan nama saya (tampil sebagai inisial)'}
          </button>
        </div>
      </section>

      {help && (
        <Sheet title="Cara kerja poin" onClose={() => setHelp(false)}>
          <h2 className="text-xl font-bold">Bagaimana cara kerjanya?</h2>
          <ol className="mt-4 space-y-3 text-[15px]">
            {[
              '+10 poin untuk setiap tugas yang buktinya disetujui, dan +20 bonus saat aksi selesai.',
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
      <BadgeUnlockedDialog />
    </div>
  );
}
