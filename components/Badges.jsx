'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Check, Leaf, Lock, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAksiState, addPoints } from '../lib/aksiStore';
import { focusRing, fontWrap, ProgressBar } from '../components/AksiShared';

/* Three badges unlocked by total points, in order. */
export const BADGES = [
  { id: 'penjaga-hijau', name: 'Penjaga Hijau', Icon: Leaf, fill: '#159038', border: '#0F6B2A', threshold: 50 },
  { id: 'penggerak-warga', name: 'Penggerak Warga', Icon: Users, fill: '#F97316', border: '#C2570C', iconColor: '#111827', threshold: 100 },
  { id: 'pelopor-aksi', name: 'Pelopor Aksi', Icon: Award, fill: '#B3006B', border: '#85004F', threshold: 120 },
];

export const badgeForPoints = (points) => [...BADGES].reverse().find((b) => points >= b.threshold) || null;

export function badgeProgress(points) {
  const current = badgeForPoints(points);
  const next = BADGES.find((b) => points < b.threshold) || null;
  return { current, next };
}

/* Celebration dialog state (local, demo only). */
let celebrateId = null;
const listeners = new Set();
const subscribe = (l) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const setCelebrate = (id) => {
  celebrateId = id;
  listeners.forEach((l) => l());
};
const useCelebrate = () => useSyncExternalStore(subscribe, () => celebrateId, () => null);

/* Demo: add the points needed to unlock the next badge. */
export function demoUnlockBadge(points) {
  const { next } = badgeProgress(points);
  if (!next) return;
  addPoints(next.threshold - points);
  setCelebrate(next.id);
}

const SIZES = {
  16: { box: 'h-4 w-4', icon: 'h-2.5 w-2.5', border: 1 },
  48: { box: 'h-12 w-12', icon: 'h-6 w-6', border: 2 },
  56: { box: 'h-14 w-14', icon: 'h-7 w-7', border: 2 },
  96: { box: 'h-24 w-24', icon: 'h-11 w-11', border: 2 },
};

/* state: 'unlocked' | 'next' (faded colour) | 'locked' (grayscale) */
export function BadgeIcon({ badge, size = 48, state = 'unlocked', className }) {
  const s = SIZES[size];
  const { Icon } = badge;
  return (
    <span className={cn('relative inline-flex shrink-0', state === 'next' && 'opacity-45', state === 'locked' && 'grayscale opacity-60', className)} aria-hidden>
      <span className={cn('flex items-center justify-center rounded-full', s.box)} style={{ backgroundColor: badge.fill, border: `${s.border}px solid ${badge.border}`, color: badge.iconColor || '#FFFFFF' }}>
        <Icon className={s.icon} strokeWidth={2} />
      </span>
      {state !== 'unlocked' && size > 16 && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#6B7280] text-white">
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}
    </span>
  );
}

/* 1. Main badge progress card (menggunakan prop points dari Supabase, fallback ke store lokal). */
export function BadgeProgressCard({ points: externalPoints }) {
  const store = useAksiState();
  const points = externalPoints !== undefined ? externalPoints : store.points;
  const { current, next } = badgeProgress(points);
  const shown = current || BADGES[0];

  return (
    <section className="rounded-2xl bg-white p-5 text-center shadow-[0_4px_16px_rgba(17,24,39,0.08)]" aria-label="Progres lencana">
      <BadgeIcon badge={shown} size={96} state={current ? 'unlocked' : 'next'} />
      <p className="mt-3 text-xl font-bold">Lencana {shown.name}</p>
      {next ? (
        <>
          <div className="mx-auto mt-3 max-w-[260px]">
            <ProgressBar value={Math.min(100, Math.round((points / next.threshold) * 100))} label={`Menuju Lencana ${next.name}`} />
          </div>
          <p className="mt-2 text-sm text-[#6B7280]">
            {points}/{next.threshold} poin menuju Lencana {next.name}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm font-semibold text-[#0F6B2A]">Semua lencana terbuka!</p>
      )}
    </section>
  );
}

/* 3. Profile badge collection (menggunakan prop points dari Supabase, fallback ke store lokal). */
export function BadgeCollectionCard({ points: externalPoints, className, headingClassName }) {
  const store = useAksiState();
  const points = externalPoints !== undefined ? externalPoints : store.points;
  const { next } = badgeProgress(points);

  return (
    <section id="koleksi-lencana" className={cn('scroll-mt-24', className)} aria-labelledby="badge-h">
      <h2 id="badge-h" className={headingClassName}>
        Koleksi Lencana
      </h2>
      <ul className="grid grid-cols-3 gap-2 px-5 pt-2">
        {BADGES.map((b) => {
          const state = points >= b.threshold ? 'unlocked' : b.id === next?.id ? 'next' : 'locked';
          const label = state === 'unlocked' ? `${b.name}, terbuka` : `${b.name}, terkunci, butuh ${b.threshold} poin`;
          return (
            <li key={b.id} className="flex flex-col items-center text-center" aria-label={label}>
              <BadgeIcon badge={b} size={56} state={state} />
              <span className={cn('mt-2 text-xs font-bold leading-tight', state === 'unlocked' ? 'text-[#111827]' : 'text-[#6B7280]')}>{b.name}</span>
              <span className={cn('mt-0.5 inline-flex items-center gap-0.5 text-xs', state === 'unlocked' ? 'text-[#0F6B2A]' : 'text-[#6B7280]')}>
                {state === 'unlocked' ? (
                  <>
                    <Check className="h-3 w-3" aria-hidden /> Terbuka
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" aria-hidden /> {b.threshold} poin
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* 4. Success modal shown after a badge unlocks. */
export function BadgeUnlockedDialog() {
  const router = useRouter();
  const id = useCelebrate();
  const ref = useRef(null);
  const badge = BADGES.find((b) => b.id === id);

  useEffect(() => {
    if (!badge) return;
    ref.current?.querySelector('button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setCelebrate(null);
      if (e.key === 'Tab') {
        e.preventDefault();
        ref.current?.querySelector('button')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [badge]);

  if (!badge) return null;
  const { Icon } = badge;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/60 p-4" onClick={() => setCelebrate(null)}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-success-h"
        onClick={(e) => e.stopPropagation()}
        className={cn('w-full max-w-[340px] rounded-2xl bg-white px-6 pb-6 pt-8 text-center shadow-[0_12px_40px_rgba(17,24,39,0.25)]', fontWrap)}
      >
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#159038]/25 opacity-0 motion-safe:animate-[badge-glow_1.2s_ease-out_2]" aria-hidden />
          <span
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 bg-white shadow-[0_0_24px_rgba(21,144,56,0.45)] motion-safe:animate-[badge-pop_450ms_ease-out]"
            style={{ borderColor: '#159038', color: badge.fill }}
            aria-hidden
          >
            <Icon className="h-11 w-11" strokeWidth={2} />
          </span>
        </div>
        <h2 id="badge-success-h" className="mt-5 text-2xl font-bold">
          Selamat!
        </h2>
        <p className="mt-2 text-[15px] text-[#374151]">Kamu berhasil membuka lencana {badge.name}!</p>
        <button
          onClick={() => {
            setCelebrate(null);
            router.push('/profile#koleksi-lencana');
          }}
          className={cn('mt-6 min-h-12 w-full rounded-full bg-[#159038] px-6 text-[15px] font-semibold text-white hover:bg-[#0F6B2A]', focusRing)}
        >
          Lihat Profil
        </button>
      </div>
    </div>
  );
}