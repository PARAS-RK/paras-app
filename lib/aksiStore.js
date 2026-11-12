"use client";

import { areaLabel, shortName, currentUser } from '@/lib/currentUser';
import { useSyncExternalStore } from 'react';
export const USER_AREA = areaLabel;
const coordinator = { name: 'Ibu Ratna Sari', role: `Ketua PKK ${areaLabel}`, initials: 'RS', phone: '6281234567890' };
const task = (id, title, status = 'belum') => ({ id, title, status, photos: [], note: '' });
const createParticipant = (a) => ({
    userId: currentUser.userId,
    name: currentUser.fullName,
    checklist: a.tasks.map((t) => ({
        taskId: t.id,
        status: 'belum'
    })),
    joinedAt: new
Date().toISOString(),
});
const initialAksi = [
    {
        id: 'biopori-rw05',
        title: 'Buat Lubang Biopori di RW 05',
        objective: 'Kurangi genangan air dengan membuat lubang biopori bersama.',
        category: 'Banjir & Drainase', status: 'aktif', location: USER_AREA,
        participants: 24, quota: 40, achieved: 32, target: 50, unit: 'lubang',
        reportCount: 12, reportTopic: 'genangan air',
        schedule: { date: 'Sabtu, 25 Okt 2026', time: '07.00–09.00', place: 'Balai RW 05' },
        targetLabel: '50 lubang biopori di RW 05',
        coordinator,
        steps: [
            'Pilih tanah yang sering tergenang, minimal 50 cm dari pondasi rumah.',
            'Buat lubang sedalam 80–100 cm dengan bor biopori.',
            'Isi lubang dengan sampah organik seperti sisa sayur dan daun kering.',
            'Pasang tutup berlubang, lalu foto sebagai bukti.',
        ],
        safety: ['Pakai sarung tangan dan alas kaki tertutup.', 'Tutup lubang agar anak-anak tidak terperosok.'],
        joined: true, lastStep: 3, safetyRead: true, pointsEarned: 30,
         participantList: [
    {
        userId: currentUser.userId,
        name: currentUser.fullName,
        checklist: [
            { taskId: 't1', status: 'selesai' },
            { taskId: 't2', status: 'selesai' },
            { taskId: 't3', status: 'selesai' },
            { taskId: 't4', status: 'belum' },
        ],
        joinedAt: new Date().toISOString(),
    },
    {
        userId: 'dummy-user-biopori-rw05-1',
        name: 'Ibu Ratna Sari',
        role: 'Koordinator PKK',
        checklist: [
            { taskId: 't1', status: 'selesai' },
            { taskId: 't2', status: 'selesai' },
            { taskId: 't3', status: 'selesai' },
            { taskId: 't4', status: 'selesai' },
        ],
        joinedAt: new Date().toISOString(),
    },
    ...Array.from({ length: 22 }, (_, index) => {
        const completedCount = index % 5;

        return {
            userId: `dummy-user-biopori-rw05-${index + 2}`,
            name: `Warga Dummy ${String(index + 3).padStart(2, '0')}`,
            checklist: ['t1', 't2', 't3', 't4'].map((taskId, taskIndex) => ({
                taskId,
                status: taskIndex < completedCount ? 'selesai' : 'belum',
            })),
            joinedAt: new Date().toISOString(),
        };
    }),
],
        tasks: [
            task('t1', 'Pilih tanah yang sering tergenang, minimal 50 cm dari pondasi rumah.', 'selesai'),
            task('t2', 'Buat lubang sedalam 80–100 cm dengan bor biopori.', 'selesai'),
            task('t3', 'Isi lubang dengan sampah organik seperti sisa sayur dan daun kering.', 'selesai'),
            task('t4', 'Pasang tutup berlubang, lalu foto sebagai bukti.'),
        ],
        evidences: [
            {
        id: 'evidence-demo-001',
        userId: 'dummy-user-biopori-rw05-1',
        participantName: 'Ibu Ratna Sari',
        photos: [
            'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900'
        ],
        note: 'Dokumentasi akhir kegiatan pembuatan lubang biopori.',
        status: 'menunggu',
        rejectionReason: null,
        submittedAt: new Date().toISOString(),
    },
],
    },
    {
        id: 'pilah-sampah-7-hari',
        title: 'Pilah Sampah Rumah Tangga 7 Hari',
        objective: 'Biasakan memilah sampah organik dan anorganik di rumah.',
        category: 'Sampah', status: 'aktif', location: USER_AREA,
        participants: 18, quota: 50, achieved: 12, target: 50, unit: 'keluarga',
        reportCount: 14, reportTopic: 'penumpukan sampah',
        schedule: { date: '20–26 Okt 2026', time: 'Setiap sore', place: 'Rumah masing-masing' },
        targetLabel: '50 keluarga rutin memilah sampah',
        coordinator,
        steps: [
            'Siapkan dua wadah: organik dan anorganik.',
            'Buang sampah ke wadah yang sesuai setiap hari.',
            'Foto kedua wadah setiap sore.',
        ],
        safety: ['Bungkus benda tajam dengan kertas sebelum dibuang.', 'Simpan baterai bekas terpisah, jangan dibakar.'],
        joined: false, lastStep: 1, safetyRead: false, pointsEarned: 0,
        tasks: [task('t1', 'Siapkan dua wadah sampah'), task('t2', 'Pilah sampah hari pertama'), task('t3', 'Pilah sampah hari kedua')],
        participantList: [],
        evidences: [],
    },
    {
        id: 'kerja-bakti-selokan',
        title: 'Kerja Bakti Bersihkan Selokan',
        objective: 'Bersihkan selokan agar air hujan mengalir lancar.',
        category: 'Banjir & Drainase', status: 'akan-datang', startDate: '8 Nov', location: USER_AREA,
        participants: 10, quota: 30, achieved: 0, target: 30, unit: 'titik selokan',
        reportCount: 8, reportTopic: 'selokan tersumbat',
        schedule: { date: 'Minggu, 8 Nov 2026', time: '06.30–10.00', place: 'Pos Ronda RW 02' },
        targetLabel: '30 titik selokan bersih',
        coordinator,
        steps: ['Kumpul di pos ronda dan ambil alat.', 'Angkat sampah dengan serokan ke karung.', 'Bawa karung ke TPS bersama-sama.'],
        safety: ['Pakai sepatu bot dan sarung tangan karet.', 'Cuci tangan dengan sabun setelah selesai.'],
        joined: false, lastStep: 1, safetyRead: false, pointsEarned: 0,
        tasks: [task('t1', 'Siapkan karung dan serokan'), task('t2', 'Bersihkan selokan depan rumah')],
        participantList: [],
        evidences: [],
    },
];
let state = {
    aksi: initialAksi,
    points: 95,
    streak: 3,
    completed: 4,
    hideName: false,
    others: [
        { id: 'u1', name: 'Bu Siti Aminah', points: 120 },
        { id: 'u2', name: 'Ibu Dewi Lestari', points: 105 },
        { id: 'u3', name: 'Rina Wulandari', points: 90 },
        { id: 'u5', name: 'Bu Yuni', points: 60 },
        { id: 'u6', name: 'Nur Hidayah', points: 45 },
        { id: 'u7', name: 'Bu Tini', points: 30 },
    ],
};
const listeners = new Set();
const subscribe = (l) => { listeners.add(l); return () => { listeners.delete(l); }; };
const set = (fn) => { state = fn(state); listeners.forEach((l) => l()); };
const setAksi = (id, fn) => set((s) => ({ ...s, aksi: s.aksi.map((a) => (a.id === id ? fn(a) : a)) }));
export const useAksiState = () => useSyncExternalStore(subscribe, () => state, () => state);
export const useAksi = (id) => useAksiState().aksi.find((a) => a.id === id);
export function ranking(s) {
    return [...s.others, { id: 'me', name: shortName, points: s.points, me: true }].sort((a, b) => b.points - a.points);
}
export function joinAksi(id) {
    let joined = false;

    setAksi(id, (a) => {
        const userId = currentUser.userId;
        const alreadyJoined = (a.participantList || []).some(
            (p) => p.userId === userId
        );

        if (alreadyJoined) return a;

        joined = true;

        return {
            ...a,
            joined: true,
            participants: (a.participants || 0) + 1,
            participantList: [
                ...(a.participantList || []),
                createParticipant(a),
            ],
            safetyRead: true,
            lastStep: 3,
        };
    });

    return joined;
}
export const setLastStep = (id, step) => setAksi(id, (a) => ({ ...a, lastStep: Math.max(a.lastStep, step) }));
export const markSafetyRead = (id) => setAksi(id, (a) => ({ ...a, safetyRead: true }));
export const toggleHideName = () => set((s) => ({ ...s, hideName: !s.hideName }));
export const addPoints = (n) => set((s) => ({ ...s, points: s.points + n }));
export const markComplete = (id) =>
    setAksi(id, (a) => {
        if (a.status === 'selesai') return a;

        return {
            ...a,
            status: 'selesai',
            completedAt: new Date().toISOString(),
        };
    });
/** Publish an approved admin draft into the citizen Aksi list. */
export function publishCommunityAksi(input) {
    const id = `admin-${input.sourceId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (state.aksi.some((aksi) => aksi.id === id))
        return id;
    const published = {
        id,
        sourceReportIds: input.sourceReportIds || [],
        title: input.title,
        objective: input.description,
        category: input.category,
        registrationRange: input.registrationRange,
        status: 'aktif',
        startDate: input.implementationRange,
        location: input.location,
        participants: 0,
        quota: input.participantTarget,
        achieved: 0,
        target: input.participantTarget,
        unit: 'peserta',
        reportCount: input.reportCount,
        reportTopic: input.title.toLowerCase(),
        schedule: { date: input.implementationRange, time: input.duration, place: input.location },
        targetLabel: `${input.participantTarget} warga berpartisipasi`,
        coordinator,
        steps: input.steps,
        safety: ['Ikuti arahan Ketua PKK dan koordinator lapangan.', 'Gunakan perlengkapan yang sesuai dengan kegiatan.'],
        joined: false,
        lastStep: 1,
        safetyRead: false,
        pointsEarned: 0,
        tasks: input.steps.map((title, index) => task(`t${index + 1}`, title)),
        tasksDoneTotal: 0,
    };
    set((current) => ({ ...current, aksi: [published, ...current.aksi] }));
    return id;
}
export function submitEvidence(id, photos, note, participant) {
    const action = state.aksi.find((a) => a.id === id);
    if (!action || !participant?.userId) return false;

if (!Array.isArray(photos) || photos.length === 0) return false;

// Validasi seluruh checklist peserta harus selesai
const participantData = (action.participantList || []).find(
    (p) => p.userId === participant.userId
);

if (!participantData) return false;

const completedTaskIds = new Set(
    (participantData.checklist || [])
        .filter((item) => item.status === 'selesai')
        .map((item) => item.taskId)
);

const allTasksComplete =
    (action.tasks || []).length > 0 &&
    action.tasks.every((task) => completedTaskIds.has(task.id));

if (!allTasksComplete) return false;
    const hasPendingEvidence = (action.evidences || []).some(
        (e) =>
            e.userId === participant.userId &&
            e.status === 'menunggu'
    );

    if (hasPendingEvidence) return false;

    setAksi(id, (a) => ({
        ...a,
        evidences: [
            ...(a.evidences || []),
            {
                id: `evidence-${Date.now()}`,
                userId: participant.userId,
                participantName: participant.name,
                photos,
                note: note || '',
                status: 'menunggu',
                rejectionReason: null,
                submittedAt: new Date().toISOString(),
            },
        ],
    }));

    return true;
}
/** Save checked checklist steps. Each newly saved step is completed right away and earns +10 points. */
export function saveChecklist(id, taskIds) {
    const a = state.aksi.find((x) => x.id === id);
    if (!a) return 0;

    const userId = currentUser.userId;
    const participant = (a.participantList || []).find(
        (p) => p.userId === userId
    );

    if (!participant) return 0;

    const fresh = participant.checklist
        .filter((item) =>
            taskIds.includes(item.taskId) &&
            item.status !== 'selesai'
        )
        .map((item) => item.taskId);

    const n = fresh.length;
    if (!n) return 0;

    setAksi(id, (action) => ({
        ...action,
        participantList: action.participantList.map((p) =>
            p.userId !== userId
                ? p
                : {
                    ...p,
                    checklist: p.checklist.map((item) =>
                        fresh.includes(item.taskId)
                            ? { ...item, status: 'selesai' }
                            : item
                    ),
                }
        ),
        pointsEarned: (action.pointsEarned || 0) + 10 * n,
    }));

    set((s) => ({
        ...s,
        points: s.points + 10 * n,
    }));

    return n;
}
/** Final outcome photos, uploaded once after every checklist step is saved. */
export const submitOutcome = (id, photos, note, participant) => submitEvidence(id, photos, note, participant);
/** Demo: approve the first pending evidence. Only approval raises progress and points. */
export function approveFirstPending(id, evidenceId) {
  const action = state.aksi.find((a) => a.id === id);
  if (!action) return false;

  const evidence = (action.evidences || []).find(
    (e) => e.id === evidenceId
  );

  if (!evidence || evidence.status !== 'menunggu') return false;

  setAksi(id, (a) => ({
    ...a,
    evidences: a.evidences.map((e) =>
      e.id === evidenceId
        ? {
            ...e,
            status: 'diterima',
            verifiedAt: new Date().toISOString(),
          }
        : e
    ),
  }));

  return true;
}
export function rejectEvidence(id, evidenceId, reason) {
  const action = state.aksi.find((a) => a.id === id);
  if (!action) return false;

  const evidence = (action.evidences || []).find(
    (e) => e.id === evidenceId
  );

  if (!evidence || evidence.status !== 'menunggu') return false;

  setAksi(id, (a) => ({
    ...a,
    evidences: a.evidences.map((e) =>
      e.id === evidenceId
        ? {
            ...e,
            status: 'ditolak',
            rejectionReason: reason,
            rejectedAt: new Date().toISOString(),
          }
        : e
    ),
  }));

  return true;
}
export const myTaskStats = (a) => {
    const participant = (a?.participantList || []).find(
        (p) => p.userId === currentUser.userId
    );

    const checklist = participant?.checklist || [];

    return {
        done: checklist.filter((item) => item.status === 'selesai').length,
        total: checklist.length,
    };
};
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export function getCompletedChecklistTotal(action) {
    return (action.participantList || []).reduce((total, participant) => {
        const completed = (participant.checklist || []).filter(
            (item) => item.status === 'selesai'
        ).length;

        return total + completed;
    }, 0);
}
export const initialsOf = (name) => name.replace(/^(Bu|Ibu)\s+/, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export function waShareUrl(a) {
    const url = `${window.location.origin}/aksi/${a.id}`;
    return `https://wa.me/?text=${encodeURIComponent(`${a.title}\nYuk ikut aksi bersama warga ${a.location}! ${a.objective}\n${url}`)}`;
}