'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Phone, Link2, ShieldCheck, MapPin, Clock, Calendar, Target, Camera, Image as ImageIcon, CheckCircle2, Upload, Lock, Users, ListChecks, Trophy, Leaf, Save, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAksi, joinAksi, setLastStep, markSafetyRead, saveChecklist, submitOutcome, markComplete, myTaskStats, pct, waShareUrl } from './aksiStore';
import { StatusBadge, Avatar, ProgressBar, JoinModal, ToastHost, showToast, CategoryArt, btnPrimary, btnSecondary, focusRing, fontWrap } from './AksiShared';
const STEPS = ['Ringkasan', 'Panduan', 'Checklist & Hasil', 'Progres'];

export default function AksiDetail({ id }) {
  const a = useAksi(id);
  if (!a) {
    return (
      <div className={cn('min-h-full bg-[#F8F9FA] px-4 py-16 text-center', fontWrap)}>
        <p className="text-[15px]">Aksi tidak ditemukan.</p>
        <Link href="/aksi" className={cn(btnPrimary, 'mt-4')}>
          Ke Daftar Aksi
        </Link>
      </div>
    );
  }
  return <Stepper key={a.id} a={a} />;
}

function Stepper({ a }) {
  const router = useRouter();
  const done = a.status === 'selesai';
  const [step, setStep] = useState(a.joined || done ? a.lastStep : 1);
  const [dir, setDir] = useState(1);
  const [agree, setAgree] = useState(a.safetyRead);
  const [joining, setJoining] = useState(false);
  const canJump = a.joined || done;
  const locked = (n) => !a.joined && !done && n >= 3;

  const go = (n) => {
    if (n < 1 || n > 4 || locked(n)) return;
    setDir(n > step ? 1 : -1);
    setStep(n);
    if (a.joined) setLastStep(a.id, n);
    window.scrollTo({ top: 0 });
  };

  const onNext = () => {
    if (step === 2 && !a.joined && !done) {
      setJoining(true);
      return;
    }
    if (step === 2 && !a.safetyRead) markSafetyRead(a.id);
    if (step === 4) {
      router.push('/aksi');
      return;
    }
    go(step + 1);
  };

  const nextLabel = step === 4 ? 'Selesai' : step === 2 && !a.joined && !done ? 'Ikut Aksi Ini' : 'Lanjut';
  const nextDisabled = step === 2 && !done && !a.safetyRead && a.joined && !agree;

  return (
    <div className={cn('min-h-full bg-[#F8F9FA]', fontWrap)}>
      <style>{`@keyframes aksi-in-r{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}@keyframes aksi-in-l{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.aksi-slide{animation:none!important}}`}</style>
      <div className="mx-auto max-w-[860px] px-4 pb-36 pt-4 lg:px-8 lg:pt-8">
        {/* Header */}
        <div className="flex items-start gap-2">
          <button onClick={() => router.push('/aksi')} aria-label="Kembali ke daftar aksi" className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-white', focusRing)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <StatusBadge status={a.status} />
            <h1 className="mt-1.5 text-[22px] font-bold leading-tight lg:text-[28px]">{a.title}</h1>
          </div>
          <a
            href={waShareUrl(a)}
            target="_blank"
            rel="noreferrer"
            aria-label="Bagikan ke WhatsApp"
            className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6]', focusRing)}
          >
            <Share2 className="h-5 w-5 text-[#159038]" />
          </a>
        </div>

        {/* Step indicator */}
        <nav aria-label="Langkah aksi" className="mt-5">
          <p className="text-sm font-semibold text-[#374151] lg:hidden">
            Langkah {step} dari 4: {STEPS[step - 1]}
          </p>
          <ol className="mt-2 grid grid-cols-4 gap-1.5 lg:gap-3">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const passed = n < step;
              const isLocked = locked(n);
              return (
                <li key={label}>
                  <button
                    onClick={() => go(n)}
                    disabled={!canJump || isLocked}
                    aria-current={active ? 'step' : undefined}
                    aria-label={`Langkah ${n}: ${label}${isLocked ? ' (terkunci)' : ''}`}
                    className={cn('group flex w-full flex-col gap-1.5 rounded-lg py-1 text-left', focusRing, canJump && !isLocked ? 'cursor-pointer' : 'cursor-default')}
                  >
                    <span className={cn('h-2 w-full rounded-full', active || passed ? 'bg-[#159038]' : 'bg-[#E5E7EB]')} />
                    <span className={cn('hidden items-center gap-1.5 text-sm lg:flex', active ? 'font-bold text-[#0F6B2A]' : 'text-[#4B5563]')}>
                      <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', active || passed ? 'bg-[#159038] text-white' : 'bg-[#E5E7EB] text-[#374151]')}>
                        {isLocked ? <Lock className="h-3 w-3" /> : passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                      </span>
                      {label}
                    </span>
                    {isLocked && <Lock className="h-3.5 w-3.5 self-center text-[#6B7280] lg:hidden" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {done && step !== 4 && (
          <p className="mt-3 flex items-center gap-2 text-sm text-[#4B5563]">
            <Lock className="h-4 w-4" aria-hidden /> Mode baca saja, aksi ini sudah selesai.
          </p>
        )}

        <div key={step} className="aksi-slide mt-5" style={{ animation: `${dir === 1 ? 'aksi-in-r' : 'aksi-in-l'} .25s ease-out` }}>
          {step === 1 && <StepRingkasan a={a} />}
          {step === 2 && <StepPanduan a={a} agree={agree} setAgree={setAgree} />}
          {step === 3 && (locked(3) ? <LockedStep /> : <StepTugas a={a} readOnly={done} />)}
          {step === 4 && (locked(4) ? <LockedStep /> : <StepProgres a={a} onRanking={() => router.push('/aksi?seg=peringkat')} />)}
        </div>
      </div>

      {/* Sticky bottom buttons */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[860px] gap-3 p-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:px-8">
          <button onClick={() => (step === 1 ? router.push('/aksi') : go(step - 1))} className={cn(btnSecondary, 'min-h-12 flex-1')}>
            {step === 1 ? 'Ke Daftar Aksi' : 'Kembali'}
          </button>
          <button onClick={onNext} disabled={nextDisabled} className={cn(btnPrimary, 'flex-1')}>
            {nextLabel}
          </button>
        </div>
      </div>

      {joining && (
        <JoinModal
          aksi={a}
          onClose={() => setJoining(false)}
          onConfirm={() => {
            joinAksi(a.id);
            setJoining(false);
            setAgree(true);
            showToast({ msg: 'Kamu sudah bergabung' });
            setDir(1);
            setStep(3);
          }}
        />
      )}
      <ToastHost />
    </div>
  );
}

function Card({ children, className }) {
  return <section className={cn('rounded-2xl bg-white p-4 shadow-sm lg:p-5', className)}>{children}</section>;
}

function LockedStep() {
  return (
    <Card className="flex flex-col items-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]">
        <Lock className="h-8 w-8 text-[#6B7280]" aria-hidden />
      </div>
      <p className="mt-3 text-[15px] font-semibold">Ikut aksi dulu untuk membuka langkah ini</p>
    </Card>
  );
}

/* Langkah 1 */
function StepRingkasan({ a }) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold">Tujuan aksi</h2>
        <p className="mt-2 text-[15px]">{a.objective}</p>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#FDF2F8] p-3 text-[15px] text-[#B3006B]">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <b>Mengapa aksi ini ada?</b> Berawal dari {a.reportCount} laporan {a.reportTopic} warga.
          </span>
        </p>
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Jadwal dan target</h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          <li className="flex items-center gap-2">
            <Calendar className="h-5 w-5 shrink-0 text-[#159038]" aria-hidden />
            {a.schedule.date}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-5 w-5 shrink-0 text-[#159038]" aria-hidden />
            {a.schedule.time}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-[#159038]" aria-hidden />
            {a.schedule.place}, {a.location}
          </li>
          <li className="flex items-center gap-2">
            <Target className="h-5 w-5 shrink-0 text-[#159038]" aria-hidden />
            Target: {a.targetLabel}
          </li>
        </ul>
      </Card>
      <Card className="flex items-center gap-3">
        <Avatar initials={a.coordinator.initials} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#4B5563]">Koordinator</p>
          <p className="font-semibold">{a.coordinator.name}</p>
        </div>
        <a href={`https://wa.me/${a.coordinator.phone}`} target="_blank" rel="noreferrer" className={btnSecondary}>
          <Phone className="h-4 w-4" /> Hubungi
        </a>
      </Card>
    </div>
  );
}

/* Langkah 2 */
function StepPanduan({ a, agree, setAgree }) {
  const needsCheck = a.joined && !a.safetyRead && a.status !== 'selesai';
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold">Cara melakukan</h2>
        <ol className="mt-3 space-y-3">
          {a.steps.slice(0, 4).map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#159038] text-sm font-bold text-white">{i + 1}</span>
              <span className="pt-1 text-[15px]">{s}</span>
            </li>
          ))}
        </ol>
      </Card>
      <div className="rounded-2xl border border-[#FDBA74] bg-[#FFEDD5] p-4 text-[#111827]">
        <p className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="h-5 w-5" aria-hidden /> Panduan Keselamatan
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
          {a.safety.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      {needsCheck && (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#D1D5DB] bg-white p-3 text-[15px] has-[:checked]:border-[#0F6B2A] has-[:checked]:bg-[#ECFDF5]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-6 w-6 shrink-0 accent-[#0F6B2A]" />
          Saya sudah membaca panduan keselamatan
        </label>
      )}
      {!a.joined && a.status !== 'selesai' && <p className="text-sm text-[#4B5563]">Ini pratinjau. Ketuk "Ikut Aksi Ini" untuk membuka langkah Tugas dan Progres.</p>}
    </div>
  );
}

/* Langkah 3 */
function StepTugas({ a, readOnly }) {
  const [draft, setDraft] = useState([]);
  const saved = (t) => t.status === 'selesai';
  const savedCount = a.tasks.filter(saved).length;
  const allSaved = savedCount === a.tasks.length;
  const toggle = (tid) => setDraft((d) => (d.includes(tid) ? d.filter((x) => x !== tid) : [...d, tid]));

  const save = () => {
    const n = saveChecklist(a.id, draft);
    setDraft([]);
    if (n) showToast({ msg: `${n} langkah tersimpan. +${10 * n} poin` });
  };

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-2xl bg-[#ECFDF5] p-3 text-[15px]">
        <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-[#0F6B2A]" aria-hidden />
        Centang langkah yang sudah dikerjakan, lalu simpan. Setiap langkah tersimpan memberi +10 poin. Foto hanya diunggah sekali di akhir untuk menunjukkan hasil aksi.
      </p>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Checklist langkah</h2>
          <span className="text-sm font-semibold text-[#4B5563]">
            {savedCount}/{a.tasks.length} tersimpan
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar value={pct(savedCount, a.tasks.length)} label="Progres checklist" />
        </div>
        <ul className="mt-4 space-y-2">
          {a.tasks.map((t) => {
            const isSaved = saved(t);
            const checked = isSaved || draft.includes(t.id);
            return (
              <li key={t.id}>
                <label
                  className={cn(
                    'flex min-h-14 items-center gap-3 rounded-xl border p-3 text-[15px]',
                    isSaved ? 'border-[#BBF7D0] bg-[#F0FDF4]' : checked ? 'border-[#0F6B2A] bg-[#ECFDF5]' : 'border-[#E5E7EB] bg-white',
                    isSaved || readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-[#F8F9FA]',
                  )}
                >
                  <input type="checkbox" checked={checked} disabled={isSaved || readOnly} onChange={() => toggle(t.id)} className="h-6 w-6 shrink-0 accent-[#0F6B2A]" />
                  <span className={cn('min-w-0 flex-1 font-semibold', isSaved && 'text-[#374151]')}>{t.title}</span>
                  {isSaved && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-semibold text-[#0F6B2A]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Tersimpan
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
        {!readOnly && !allSaved && (
          <button onClick={save} disabled={!draft.length} className={cn(btnPrimary, 'mt-4 w-full')}>
            <Save className="h-4 w-4" /> Simpan Checklist{draft.length ? ` (${draft.length})` : ''}
          </button>
        )}
      </Card>

      <OutcomeUpload a={a} unlocked={allSaved} readOnly={readOnly} />
    </div>
  );
}

const SAMPLE = ['#BBF7D0', '#BFDBFE', '#FBCFE8'];

function Photo({ src }) {
  return src.startsWith('#') ? (
    <div className="flex h-full w-full items-center justify-center" style={{ background: src }}>
      <ImageIcon className="h-6 w-6 text-[#111827]/40" aria-label="Foto contoh" />
    </div>
  ) : (
    <img src={src} alt="Foto bukti" className="h-full w-full object-cover" />
  );
}

function OutcomeUpload({ a, unlocked, readOnly }) {
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const camRef = useRef(null);
  const galRef = useRef(null);

  const add = (files) => {
    if (!files) return;
    const urls = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...urls].slice(0, 3));
  };

  const send = () => {
    if (!photos.length) {
      setErr('Tambahkan minimal 1 foto dulu, ya.');
      return;
    }
    submitOutcome(a.id, photos, note.trim());
    setPhotos([]);
    setNote('');
    setErr('');
    showToast({ msg: 'Foto hasil aksi terkirim. Terima kasih!' });
  };

  const header = (
    <div className="flex items-center gap-3">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', unlocked ? 'bg-[#ECFDF5] text-[#159038]' : 'bg-[#F3F4F6] text-[#6B7280]')}>
        {unlocked ? <Camera className="h-5 w-5" aria-hidden /> : <Lock className="h-5 w-5" aria-hidden />}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold">Foto hasil aksi</h2>
        <p className="text-sm text-[#4B5563]">Langkah terakhir: tunjukkan hasil aksi yang sudah kamu selesaikan.</p>
      </div>
    </div>
  );

  if (a.outcome) {
    return (
      <Card>
        {header}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {a.outcome.photos.map((p, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-xl">
              <Photo src={p} />
            </div>
          ))}
        </div>
        {a.outcome.note && <p className="mt-2 text-[15px] text-[#374151]">{a.outcome.note}</p>}
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#0F6B2A]">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Foto hasil terkirim
        </p>
      </Card>
    );
  }

  if (!unlocked || readOnly) {
    return (
      <Card>
        {header}
        <p className="mt-3 rounded-xl bg-[#F8F9FA] p-3 text-sm text-[#4B5563]">{readOnly ? 'Tidak ada foto hasil yang dikirim.' : 'Simpan semua langkah checklist terlebih dahulu untuk mengunggah foto hasil.'}</p>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => camRef.current?.click()} className={cn(btnSecondary, 'min-h-16 flex-col gap-1')}>
            <Camera className="h-6 w-6 text-[#159038]" aria-hidden /> Ambil Foto
          </button>
          <button onClick={() => galRef.current?.click()} className={cn(btnSecondary, 'min-h-16 flex-col gap-1')}>
            <ImageIcon className="h-6 w-6 text-[#159038]" aria-hidden /> Pilih dari Galeri
          </button>
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              add(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={galRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              add(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        <button onClick={() => setPhotos((p) => [...p, SAMPLE[p.length % 3]].slice(0, 3))} className={cn('mt-1 min-h-11 rounded text-sm font-semibold text-[#0F6B2A] underline underline-offset-4', focusRing)}>
          Pakai foto contoh
        </button>
        {photos.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                <Photo src={p} />
                <button
                  onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                  aria-label={`Hapus foto ${i + 1}`}
                  className={cn('absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90', focusRing)}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="mt-3 block">
          <span className="text-sm font-semibold">Keterangan singkat</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: lubang di halaman depan" className={cn('mt-1 min-h-12 w-full rounded-xl border border-[#D1D5DB] px-3 text-[15px]', focusRing)} />
        </label>
        {err && (
          <p role="alert" className="mt-2 text-sm font-semibold text-[#B91C1C]">
            {err}
          </p>
        )}
        <button onClick={send} className={cn(btnPrimary, 'mt-3 w-full')}>
          <Upload className="h-4 w-4" /> Kirim Foto Hasil
        </button>
      </div>
    </Card>
  );
}

/* Langkah 4 */
function Ring({ value }) {
  const r = 42,
    c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0" role="img" aria-label={`${value}% selesai`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#159038"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset .5s' }}
      />
      <text x="50" y="56" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">
        {value}%
      </text>
    </svg>
  );
}

function StepProgres({ a, onRanking }) {
  const m = myTaskStats(a);
  const done = a.status === 'selesai';
  return (
    <div className="space-y-4">
      {done && (
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-[#0F6B2A] p-4 text-white">
            <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden />
            <p className="text-lg font-bold">Aksi Selesai - Terima kasih, ibu-ibu!</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { Icon: Users, v: `${a.participants}`, l: 'Peserta' },
              { Icon: ListChecks, v: `${a.tasksDoneTotal}`, l: 'Tugas selesai' },
              { Icon: Target, v: `${a.achieved} ${a.unit}`, l: 'Hasil utama' },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <x.Icon className="mx-auto h-5 w-5 text-[#159038]" aria-hidden />
                <p className="mt-1 text-lg font-bold leading-tight">{x.v}</p>
                <p className="text-sm text-[#4B5563]">{x.l}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <CategoryArt key={i} category={a.category} className="aspect-square rounded-xl" />
            ))}
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Progres Saya</h2>
          <div className="mt-3 flex items-center gap-4">
            <Ring value={pct(m.done, m.total)} />
            <p className="text-[15px]">
              {m.done} dari {m.total} tugas selesai
            </p>
          </div>
        </Card>
        <Card className="flex flex-col justify-center bg-[#ECFDF5]">
          <Leaf className="h-6 w-6 text-[#0F6B2A]" aria-hidden />
          <p className="mt-2 text-sm text-[#374151]">Poin didapat</p>
          <p className="text-3xl font-bold text-[#0F6B2A]">+{a.pointsEarned}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-bold">Progres Komunitas</h2>
        <p className="mt-1 text-2xl font-bold text-[#0F6B2A]">
          {a.achieved} dari {a.target} {a.unit}
        </p>
        <div className="mt-3">
          <ProgressBar value={pct(a.achieved, a.target)} big label="Progres komunitas" />
        </div>
        <p className="mt-3 flex items-start gap-2 text-[15px] text-[#374151]">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#0F6B2A]" aria-hidden />
          Aksi selesai saat target komunitas tercapai, bukan saat satu orang menyelesaikan tugasnya.
        </p>
      </Card>

      <button onClick={onRanking} className={cn(btnSecondary, 'min-h-12 w-full')}>
        <Trophy className="h-5 w-5 text-[#F5B301]" aria-hidden /> Lihat Peringkat
      </button>
      <button onClick={() => markComplete(a.id)} className={cn('mx-auto block min-h-11 rounded-lg px-3 text-sm text-[#6B7280] underline underline-offset-4', focusRing)}>
        {done ? 'Demo: kembali ke tampilan aktif' : 'Demo: lihat tampilan aksi selesai'}
      </button>
    </div>
  );
}
