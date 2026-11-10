"use client";

import { areaLabel, shortName } from '../lib/currentUser';
import { useSyncExternalStore } from 'react';
export const USER_AREA = areaLabel;
const coordinator = { name: 'Ibu Ratna Sari', role: `Ketua PKK ${areaLabel}`, initials: 'RS', phone: '6281234567890' };
const task = (id, title, status = 'belum') => ({ id, title, status, photos: [], note: '' });
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
        tasks: [
            task('t1', 'Siapkan bor dan sarung tangan', 'selesai'),
            task('t2', 'Buat lubang pertama di halaman', 'selesai'),
            task('t3', 'Isi lubang dengan sampah organik', 'selesai'),
            task('t4', 'Buat lubang kedua di halaman'),
            task('t5', 'Ajak satu tetangga membuat lubang'),
        ],
        tasksDoneTotal: 64,
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
        tasksDoneTotal: 20,
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
        tasksDoneTotal: 0,
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
    setAksi(id, (a) => (a.joined ? a : { ...a, joined: true, participants: a.participants + 1, safetyRead: true, lastStep: 3 }));
}
export const setLastStep = (id, step) => setAksi(id, (a) => ({ ...a, lastStep: Math.max(a.lastStep, step) }));
export const markSafetyRead = (id) => setAksi(id, (a) => ({ ...a, safetyRead: true }));
export const toggleHideName = () => set((s) => ({ ...s, hideName: !s.hideName }));
export const addPoints = (n) => set((s) => ({ ...s, points: s.points + n }));
export const markComplete = (id) => setAksi(id, (a) => ({ ...a, status: a.status === 'selesai' ? 'aktif' : 'selesai' }));
/** Publish an approved admin draft into the citizen Aksi list. */
export function publishCommunityAksi(input) {
    const id = `admin-${input.sourceId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (state.aksi.some((aksi) => aksi.id === id))
        return id;
    const published = {
        id,
        title: input.title,
        objective: input.description,
        category: input.category,
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
export function submitEvidence(id, taskId, photos, note) {
    setAksi(id, (a) => ({ ...a, tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, status: 'menunggu', photos, note } : t)) }));
}
/** Save checked checklist steps. Each newly saved step is completed right away and earns +10 points. */
export function saveChecklist(id, taskIds) {
    const a = state.aksi.find((x) => x.id === id);
    const fresh = a ? a.tasks.filter((t) => taskIds.includes(t.id) && t.status !== 'selesai').map((t) => t.id) : [];
    const n = fresh.length;
    if (!n)
        return 0;
    set((s) => ({
        ...s,
        points: s.points + 10 * n,
        aksi: s.aksi.map((x) => x.id !== id ? x : {
            ...x,
            achieved: Math.min(x.target, x.achieved + n),
            pointsEarned: x.pointsEarned + 10 * n,
            tasksDoneTotal: x.tasksDoneTotal + n,
            tasks: x.tasks.map((t) => (fresh.includes(t.id) ? { ...t, status: 'selesai' } : t)),
        }),
    }));
    return n;
}
/** Final outcome photos, uploaded once after every checklist step is saved. */
export const submitOutcome = (id, photos, note) => setAksi(id, (a) => ({ ...a, outcome: { photos, note } }));
/** Demo: approve the first pending evidence. Only approval raises progress and points. */
export function approveFirstPending(id) {
    const a = state.aksi.find((x) => x.id === id);
    const pending = a?.tasks.find((t) => t.status === 'menunggu');
    if (!a || !pending)
        return false;
    set((s) => ({
        ...s,
        points: s.points + 10,
        aksi: s.aksi.map((x) => x.id !== id ? x : {
            ...x,
            achieved: Math.min(x.target, x.achieved + 1),
            pointsEarned: x.pointsEarned + 10,
            tasksDoneTotal: x.tasksDoneTotal + 1,
            tasks: x.tasks.map((t) => (t.id === pending.id ? { ...t, status: 'selesai' } : t)),
        }),
    }));
    return true;
}
export const myTaskStats = (a) => ({ done: a.tasks.filter((t) => t.status === 'selesai').length, total: a.tasks.length });
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const initialsOf = (name) => name.replace(/^(Bu|Ibu)\s+/, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export function waShareUrl(a) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${baseUrl}/aksi/${a.id}`;
    return `https://wa.me/?text=${encodeURIComponent(`${a.title}\nYuk ikut aksi bersama warga ${a.location}! ${a.objective}\n${url}`)}`;
}