'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Phone, ShieldCheck, MapPin, Clock, Calendar, Target, Camera, Image as ImageIcon, CheckCircle2, Upload, Lock, Users, Trophy, Leaf, Loader2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { StatusBadge, Avatar, ProgressBar, JoinModal, ToastHost, showToast, CategoryArt, btnPrimary, btnSecondary, focusRing, fontWrap } from './AksiShared';
import { createClient } from '../lib/supabase/client';

const STEPS = ['Ringkasan', 'Panduan', 'Checklist & Hasil', 'Progres'];

export default function AksiDetail({ id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [a, setAksi] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Tarik data aksi beserta seluruh kolom relasi dari tabel regions
        const { data: actionData, error: actionError } = await supabase
          .from('community_actions')
          .select('*, regions(*)')
          .eq('action_id', id)
          .maybeSingle();

        if (actionError || !actionData) {
          setAksi(null);
          setLoading(false);
          return;
        }

        const { data: tasksData } = await supabase
          .from('action_tasks')
          .select('*')
          .eq('action_id', id)
          .order('step_order', { ascending: true });

        // Hitung total peserta yang bergabung
        const { count: totalParticipants } = await supabase
          .from('action_participants')
          .select('*', { count: 'exact', head: true })
          .eq('action_id', id);

        // Hitung jumlah peserta yang sudah menyelesaikan aksi berdasarkan bukti foto terunggah
        const { count: achievedCount } = await supabase
          .from('action_completion_proofs')
          .select('*', { count: 'exact', head: true })
          .eq('action_id', id);

        const { data: { user } } = await supabase.auth.getUser();
        let isJoined = false;
        let userParticipationId = null;
        let completedTaskIds = [];
        let existingProof = null;
        let actionStatus = 'aktif';

        if (user) {
          const { data: partData } = await supabase
            .from('action_participants')
            .select('*')
            .eq('user_id', user.id)
            .eq('action_id', id)
            .maybeSingle();
            
          if (partData) {
            isJoined = true;
            userParticipationId = partData.participation_id;

            if (partData.completion_action_status && partData.completion_action_status.toLowerCase() === 'selesai') {
              actionStatus = 'selesai';
            }

            const { data: progressData, error: progressError } = await supabase
              .from('action_task_progress')
              .select('action_task_id')
              .eq('participation_id', userParticipationId);

            if (!progressError && progressData) {
              completedTaskIds = progressData.map((p) => p.action_task_id);
            }

            const { data: proofData } = await supabase
              .from('action_completion_proofs')
              .select('*')
              .eq('participation_id', userParticipationId)
              .maybeSingle();

            if (proofData && proofData.photo_path) {
              const path = String(proofData.photo_path).trim();
              
              if (path.startsWith('data:image/') || path.startsWith('http://') || path.startsWith('https://')) {
                existingProof = path;
                actionStatus = 'selesai';
              } else {
                await supabase
                  .from('action_completion_proofs')
                  .delete()
                  .eq('participation_id', userParticipationId);
                existingProof = null;
              }
            }
          }
        }

        const formattedTasks = (tasksData || []).map((t) => ({
          id: t.action_task_id,
          title: t.step_content,
          points: t.points || 10,
          order: t.step_order,
          completed: completedTaskIds.includes(t.action_task_id),
        }));

        // Format string lokasi dinamis dari relasi regions Supabase (mendeteksi berbagai variasi nama kolom)
        let formattedLocation = 'Lokasi Wilayah Terdaftar';
        if (actionData.regions) {
          const reg = actionData.regions;
          const parts = [
            reg.subdistrict || reg.kelurahan || reg.desa,
            reg.district || reg.kecamatan,
            reg.city || reg.kabupaten || reg.kota,
            reg.province || reg.provinsi
          ].filter(Boolean);

          if (parts.length > 0) {
            formattedLocation = parts.join(', ');
          } else {
            formattedLocation = `ID Wilayah: ${actionData.region_id}`;
          }
        }

        setAksi({
          id: actionData.action_id,
          title: actionData.action_title,
          objective: actionData.action_description || 'Aksi peduli lingkungan sekitar.',
          status: actionStatus,
          joined: isJoined,
          participationId: userParticipationId,
          existingProof: existingProof,
          lastStep: actionStatus === 'selesai' ? 4 : 1,
          safetyRead: false,
          schedule: {
            date: actionData.action_start_date || 'Segera',
            time: '08:00 WIB',
            place: 'Titik Kumpul Warga',
          },
          location: formattedLocation,
          coordinator: {
            name: actionData.action_coordinator || 'Ketua PKK RW',
            phone: '6281234567890',
            initials: 'KP',
          },
          steps: formattedTasks.map((t) => t.title),
          safety: [
            'Gunakan masker dan sarung tangan pelindung.',
            'Pastikan tetap menjaga keselamatan bersama warga sekitar.',
            'Laporkan segera kepada koordinator jika terjadi kendala di lapangan.',
          ],
          tasks: formattedTasks,
          target: 50,
          achieved: achievedCount || (actionStatus === 'selesai' ? 1 : 0),
          unit: 'peserta sudah menyelesaikan',
          participants: totalParticipants || 0,
          quota: 50,
          pointsEarned: completedTaskIds.length * 10,
        });
      } catch (err) {
        console.error('Gagal memuat detail aksi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#159038]" />
      </div>
    );
  }

  if (!a) {
    return (
      <div className={cn('min-h-full bg-[#F8F9FA] px-4 py-16 text-center', fontWrap)}>
        <p className="text-[15px]">Aksi tidak ditemukan.</p>
        <Link href="/aksi" className={cn(btnPrimary, 'mt-4 inline-block')}>
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
    window.scrollTo({ top: 0 });
  };

  const onNext = () => {
    if (step === 2 && !a.joined && !done) {
      setJoining(true);
      return;
    }
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
        <div className="flex items-start gap-2">
          <button onClick={() => router.push('/aksi')} aria-label="Kembali ke daftar aksi" className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-white', focusRing)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <StatusBadge status={a.status} />
            <h1 className="mt-1.5 text-[22px] font-bold leading-tight lg:text-[28px]">{a.title}</h1>
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Yuk ikuti aksi ${a.title}`)}`} target="_blank" rel="noreferrer" aria-label="Bagikan ke WhatsApp" className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6]', focusRing)}>
            <Share2 className="h-5 w-5 text-[#159038]" />
          </a>
        </div>

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

        <div key={step} className="aksi-slide mt-5" style={{ animation: `${dir === 1 ? 'aksi-in-r' : 'aksi-in-l'} .25s ease-out` }}>
          {step === 1 && <StepRingkasan a={a} />}
          {step === 2 && <StepPanduan a={a} agree={agree} setAgree={setAgree} />}
          {step === 3 && (locked(3) ? <LockedStep /> : <StepTugas a={a} readOnly={done} />)}
          {step === 4 && (locked(4) ? <LockedStep /> : <StepProgres a={a} onRanking={() => router.push('/aksi?seg=peringkat')} />)}
        </div>
      </div>

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
                .eq('action_id', a.id)
                .limit(1)
                .maybeSingle();

              const stepId = taskData ? taskData.action_task_id : 1;

              const { error } = await supabase.from('action_participants').insert({
                user_id: user.id,
                action_id: a.id,
                joined_at: new Date().toISOString(),
                completion_action_status: 'terdaftar',
                action_step_id: stepId,
                leaderboard_point: 0,
                streak_action: 0,
              });

              if (error) throw error;

              setJoining(false);
              setAgree(true);
              showToast({ msg: 'Kamu sudah bergabung ke aksi ini!' });
              window.location.reload();
            } catch (err) {
              alert('Gagal bergabung: ' + err.message);
            }
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

function StepRingkasan({ a }) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold">Tujuan aksi</h2>
        <p className="mt-2 text-[15px]">{a.objective}</p>
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

function StepPanduan({ a, agree, setAgree }) {
  const needsCheck = a.joined && !a.safetyRead && a.status !== 'selesai';
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold">Cara melakukan</h2>
        <ol className="mt-3 space-y-3">
          {a.steps.map((s, i) => (
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
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#D1D5DB] bg-white p-3 text-[15px]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-6 w-6 shrink-0 accent-[#0F6B2A]" />
          Saya sudah membaca panduan keselamatan
        </label>
      )}
      {!a.joined && a.status !== 'selesai' && <p className="text-sm text-[#4B5563]">Ini pratinjau. Ketuk &quot;Ikut Aksi Ini&quot; untuk membuka langkah Tugas dan Progres.</p>}
    </div>
  );
}

function StepTugas({ a, readOnly }) {
  const [checkedTasks, setCheckedTasks] = useState(
    new Set(a.tasks.filter((t) => t.completed).map((t) => t.id))
  );

  const toggleTask = async (taskId) => {
    if (readOnly || !a.participationId) return;

    const newChecked = new Set(checkedTasks);
    const isNowChecked = !newChecked.has(taskId);

    if (isNowChecked) {
      newChecked.add(taskId);
    } else {
      newChecked.delete(taskId);
    }
    setCheckedTasks(newChecked);

    try {
      const supabase = createClient();

      if (isNowChecked) {
        const { error } = await supabase.from('action_task_progress').insert({
          participation_id: a.participationId,
          action_task_id: taskId,
          action_id: a.id,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('action_task_progress')
          .delete()
          .eq('participation_id', a.participationId)
          .eq('action_task_id', taskId);
        if (error) throw error;
      }

      showToast({ msg: 'Progres checklist diperbarui' });
    } catch (err) {
      console.error('Gagal menyimpan progres task:', err);
      alert('Gagal menyimpan centang ke database: ' + err.message);
      
      const reverted = new Set(checkedTasks);
      if (isNowChecked) reverted.delete(taskId);
      else reverted.add(taskId);
      setCheckedTasks(reverted);
    }
  };

  const savedCount = checkedTasks.size;
  const allSaved = savedCount === a.tasks.length;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Checklist langkah</h2>
          <span className="text-sm font-semibold text-[#4B5563]">
            {savedCount}/{a.tasks.length} selesai
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar value={Math.round((savedCount / a.tasks.length) * 100)} label="Progres checklist" />
        </div>
        <ul className="mt-4 space-y-2">
          {a.tasks.map((t) => {
            const isChecked = checkedTasks.has(t.id);
            return (
              <li key={t.id}>
                <label
                  className={cn(
                    'flex min-h-14 items-center gap-3 rounded-xl border p-3 text-[15px] cursor-pointer transition-colors',
                    isChecked ? 'border-[#0F6B2A] bg-[#ECFDF5]' : 'border-[#E5E7EB] bg-white hover:bg-[#F8F9FA]',
                    readOnly && 'cursor-default'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={readOnly}
                    onChange={() => toggleTask(t.id)}
                    className="h-6 w-6 shrink-0 accent-[#0F6B2A]"
                  />
                  <span className="min-w-0 flex-1 font-semibold text-[#374151]">{t.title}</span>
                  <span className="text-xs font-semibold text-[#159038]">+{t.points} Poin</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Card>

      <OutcomeUpload a={a} unlocked={allSaved} readOnly={readOnly} />
    </div>
  );
}

function OutcomeUpload({ a, unlocked, readOnly }) {
  const getInitialPhoto = () => {
    if (!a.existingProof || typeof a.existingProof !== 'string') return [];
    const val = a.existingProof.trim();
    if (val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://')) {
      return [val];
    }
    return [];
  };

  const [photos, setPhotos] = useState(getInitialPhoto);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const camRef = useRef(null);
  const galRef = useRef(null);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const addFiles = async (files) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    try {
      const base64List = [];
      for (const file of imageFiles) {
        const base64 = await convertFileToBase64(file);
        base64List.push(base64);
      }
      setPhotos((p) => [...p, ...base64List].slice(0, 3));
      setErr('');
    } catch (e) {
      console.error('Gagal membaca file gambar:', e);
      setErr('Gagal memuat gambar.');
    }
  };

  const sendOutcome = async () => {
    if (!photos.length || (!photos[0].startsWith('data:image/') && !photos[0].startsWith('http') && !photos[0].startsWith('https://'))) {
      setErr('Tambahkan minimal 1 foto bukti pengerjaan yang valid.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Silakan login terlebih dahulu.');
        setSubmitting(false);
        return;
      }

      // 1. Cari data partisipasi berdasarkan user yang login dan action_id
      const { data: partRecord, error: partFindError } = await supabase
        .from('action_participants')
        .select('participation_id')
        .eq('user_id', user.id)
        .eq('action_id', a.id)
        .maybeSingle();

      let activeParticipationId = a.participationId;

      if (partFindError || !partRecord) {
        // Jika belum terdaftar, buat data partisipasi baru secara otomatis
        const { data: newPart, error: insertError } = await supabase
          .from('action_participants')
          .insert({
            user_id: user.id,
            action_id: a.id,
            joined_at: new Date().toISOString(),
            completion_action_status: 'selesai',
            leaderboard_point: 10,
            streak_action: 1,
          })
          .select('participation_id')
          .single();

        if (insertError) throw insertError;
        activeParticipationId = newPart.participation_id;
      } else {
        activeParticipationId = partRecord.participation_id;
        
        // 2. Ubah status langsung pada tabel action_participants menjadi 'selesai'
        const { error: participantError } = await supabase
          .from('action_participants')
          .update({ completion_action_status: 'selesai' })
          .eq('participation_id', activeParticipationId);

        if (participantError) throw participantError;
      }

      // 3. Simpan foto bukti ke tabel action_completion_proofs
      const { error: proofError } = await supabase
        .from('action_completion_proofs')
        .upsert({
          participation_id: activeParticipationId,
          action_id: a.id,
          photo_path: photos[0],
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'participation_id' });

      if (proofError) throw proofError;

      showToast({ msg: 'Foto bukti berhasil dikirim dan aksi selesai!' });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Gagal mengirim bukti:', err);
      alert('Gagal mengirim bukti: ' + (err.message || JSON.stringify(err)));
      setSubmitting(false);
    }
  };

  const header = (
    <div className="flex items-center gap-3">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', unlocked ? 'bg-[#ECFDF5] text-[#159038]' : 'bg-[#F3F4F6] text-[#6B7280]')}>
        {unlocked ? <Camera className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
      </span>
      <div>
        <h2 className="text-lg font-bold">Foto hasil aksi</h2>
        <p className="text-sm text-[#4B5563]">Selesaikan semua checklist di atas untuk membuka upload foto.</p>
      </div>
    </div>
  );

  const hasValidPhoto = photos.length > 0 && (photos[0].startsWith('data:image/') || photos[0].startsWith('http') || photos[0].startsWith('https://'));

  if (!unlocked && !hasValidPhoto) {
    return (
      <Card>
        {header}
        <p className="mt-3 rounded-xl bg-[#F8F9FA] p-3 text-sm text-[#4B5563]">
          Selesaikan semua checklist langkah di atas untuk mengunggah foto bukti pengerjaan.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => camRef.current?.click()} className={cn(btnSecondary, 'min-h-16 flex-col gap-1')}>
            <Camera className="h-6 w-6 text-[#159038]" /> Ambil Foto
          </button>
          <button onClick={() => galRef.current?.click()} className={cn(btnSecondary, 'min-h-16 flex-col gap-1')}>
            <ImageIcon className="h-6 w-6 text-[#159038]" /> Pilih Galeri
          </button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <input ref={galRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl border">
                {(typeof p === 'string' && (p.startsWith('data:image/') || p.startsWith('http') || p.startsWith('https://'))) ? (
                  <img src={p} alt="Bukti" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400 p-2 text-center">Format foto tidak valid</div>
                )}
                <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded-full bg-white p-1 shadow">
                  <XCircle className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Keterangan singkat (opsional)"
          className={cn('min-h-12 w-full rounded-xl border border-[#D1D5DB] px-3 text-[15px]', focusRing)}
        />

        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}

        <button onClick={sendOutcome} disabled={submitting} className={cn(btnPrimary, 'w-full')}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} 
          {submitting ? 'Mengirim...' : 'Kirim Foto Bukti Selesai'}
        </button>
      </div>
    </Card>
  );
}

function StepProgres({ a, onRanking }) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-bold">Progres Komunitas</h2>
        <p className="mt-1 text-2xl font-bold text-[#0F6B2A]">
          {a.achieved} dari {a.quota || 50} {a.unit}
        </p>
        <div className="mt-4">
          <ProgressBar value={Math.round((a.achieved / (a.quota || 50)) * 100)} label="Progres penyelesaian peserta" />
        </div>
      </Card>
      <button onClick={onRanking} className={cn(btnSecondary, 'min-h-12 w-full')}>
        <Trophy className="h-5 w-5 text-[#F5B301]" aria-hidden /> Lihat Peringkat
      </button>
    </div>
  );
}