"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Clock3, Eye, FileCheck2, MapPin, ShieldCheck, Siren, Target, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReportContext } from '@/context/ReportContext';
import { pct, useAksiState } from '@/lib/aksiStore';
import { areaLabel } from '@/lib/currentUser';
import { archivedSeed } from './ActionManagement';

const emergencySeed = [
    {
        id: 'LP-2026-074',
        title: 'Pohon Tumbang Menutup Jalan RW 05',
        category: 'Infrastruktur Darurat',
        location: 'RW 05, Kel. Kebayoran Baru',
        reporter: 'Ibu Sari Wulandari',
        details: 'Pohon besar tumbang setelah angin kencang dan menutup akses utama warga di RW 05.',
        resolution: 'Tim kelurahan dan petugas terkait telah mengevakuasi pohon. Akses jalan kembali normal.',
        fieldNote: 'Pohon dievakuasi dari badan jalan dan area dibersihkan. Tidak ditemukan kerusakan lanjutan pada jaringan listrik.',
        verificationLogs: ['15.55 · Petugas lapangan mengunggah dokumentasi', '16.20 · Ketua RW mengonfirmasi akses telah terbuka', '16.40 · Ketua PKK menutup laporan'],
        status: 'handled',
        closedAt: '20 Okt 2026 · 16.40 WIB',
    },
    {
        id: 'LP-2026-068',
        title: 'Dugaan Kebocoran Gas di RT 07',
        category: 'Keselamatan Lingkungan',
        location: 'RT 07 / RW 01, Kel. Kebayoran Baru',
        reporter: 'Bapak Ahmad Fauzi',
        resolution: 'Laporan ditolak setelah pemeriksaan lapangan tidak menemukan kebocoran atau sumber bahaya.',
        fieldNote: 'Tim melakukan pemeriksaan sambungan gas dan pengukuran udara. Tidak ada indikasi kebocoran di lokasi.',
        verificationLogs: ['09.35 · Petugas tiba di lokasi', '09.50 · Pemeriksaan lapangan selesai', '10.15 · Hasil pemeriksaan diverifikasi'],
        status: 'rejected',
        closedAt: '14 Okt 2026 · 10.15 WIB',
    },
];

const communityResidentNames = [
    ['Ibu Ratna Sari', 'Koordinator PKK'],
    ['Ahmad Rahman', 'Ketua RT'],
    ['Dewi Lestari', 'Relawan warga'],
    ['Siti Aminah', 'Anggota PKK'],
    ['Nur Hidayah', 'Relawan warga'],
    ['Rina Wulandari', 'Anggota PKK'],
    ['Budi Santoso', 'Warga'],
    ['Yuni Kartika', 'Anggota PKK'],
    ['Taufik Hidayat', 'Warga'],
    ['Sri Wahyuni', 'Relawan warga'],
];
const communityProofPhotos = [
    'https://images.unsplash.com/photo-1650247452475-b5866374545d?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1733388972592-ec1da2ddc432?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1603698041800-12712170de1d?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1643216665710-9e254ce24f82?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1646095196902-4f5533638f65?auto=format&fit=crop&w=320&q=80',
];
const completedActionSteps = [
    'Mengikuti arahan dan pembagian tugas dari koordinator.',
    'Menyelesaikan tugas utama sesuai area tanggung jawab.',
    'Memastikan area kegiatan kembali bersih dan aman.',
    'Mengunggah dokumentasi hasil akhir kegiatan.',
];

function CommunityArchiveCard({ item }) {
    const [expanded, setExpanded] = useState(false);
    const [visibleParticipants, setVisibleParticipants] = useState(5);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const checklistItems = item.steps?.length ? item.steps : completedActionSteps;
    const participationProgress = pct(item.participants, item.quota);
    const completedChecklists = item.participants * checklistItems.length;
    const targetChecklists = item.quota * checklistItems.length;
    const checklistProgress = pct(completedChecklists, targetChecklists);
    const participantRecords = Array.from({ length: item.participants }, (_, index) => {
        const [name, role] = communityResidentNames[index] || [`Warga Kebayoran ${String(index + 1).padStart(2, '0')}`, index % 2 ? 'Anggota PKK' : 'Warga'];
        const initials = name.replace(/^(Ibu|Bapak)\s+/, '').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
        return {
            name,
            role,
            initials,
            checklist: `${checklistItems.length}/${checklistItems.length} checklist selesai`,
            checklistItems,
            completedAt: item.closedAt,
            photo: item.photos?.[index] || communityProofPhotos[index % communityProofPhotos.length],
            proofLabel: index % 2 ? 'Hasil akhir kegiatan' : 'Pelaksanaan kegiatan',
        };
    });
    const shownParticipants = participantRecords.slice(0, visibleParticipants);
    const remainingParticipants = participantRecords.length - shownParticipants.length;
    const toggleExpanded = () => {
        if (expanded)
            setVisibleParticipants(5);
        setExpanded((open) => !open);
    };
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-3 lg:items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark">Selesai</span>
                        <span className="text-xs font-bold text-slate-400">{item.category}</span>
                    </div>
                    <h2 className="mt-3 text-base font-black leading-snug text-slate-900">{item.title}</h2>
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"/> {item.location}</p>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-400">Partisipasi warga</span>
                        <p className="text-xs font-bold text-slate-600"><span className="font-black text-slate-900">{item.participants}</span>/{item.quota} peserta</p>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-blue-500"/> Bukti warga terverifikasi</span>
                            <span>{item.participants}/{item.quota} · {participationProgress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${participationProgress}%` }}/></div>
                    </div>
                    <div className="mt-3">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-brand"/> Progres aksi</span>
                            <span>{completedChecklists}/{targetChecklists} · {checklistProgress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${checklistProgress}%` }}/></div>
                    </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-black text-slate-800">Log Verifikasi</p>
                    <div className="mt-3 space-y-2">
                        <p className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-1.5 font-semibold text-slate-500"><Users className="h-3.5 w-3.5"/> Partisipasi</span><span className="font-black text-slate-800">{item.participants}/{item.quota}</span></p>
                        <p className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-1.5 font-semibold text-slate-500"><Target className="h-3.5 w-3.5"/> Dampak akhir</span><span className="max-w-40 text-right font-black text-slate-800">{item.impact}</span></p>
                        <p className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-1.5 font-semibold text-slate-500"><Clock3 className="h-3.5 w-3.5"/> Diselesaikan</span><span className="text-right font-black text-slate-800">{item.closedAt}</span></p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-black text-brand-dark"><FileCheck2 className="h-3.5 w-3.5"/> Terverifikasi</span>
                        <span className="text-xs font-black text-brand">100%</span>
                    </div>
                    <button type="button" onClick={toggleExpanded} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50" aria-expanded={expanded}>
                        {expanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>} {expanded ? 'Tutup Peserta' : 'Lihat Peserta'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-6">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-black text-slate-800">Partisipasi Warga</p>
                            <p className="mt-1 text-xs text-slate-400">Checklist dan bukti foto individual warga yang telah diverifikasi.</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark"><CheckCircle2 className="h-3.5 w-3.5"/> {item.participants} terverifikasi</span>
                    </div>
                    <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {shownParticipants.map((participant) => (
                            <div key={participant.name} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{participant.initials}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-black text-slate-800">{participant.name}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">{participant.role} · {participant.checklist}</p>
                                </div>
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark"><CheckCircle2 className="hidden h-3.5 w-3.5 sm:block"/> Terverifikasi</span>
                                <button type="button" onClick={() => setSelectedParticipant(participant)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors group-hover:border-brand-light hover:bg-brand-xlight hover:text-brand" aria-label={`Lihat progres ${participant.name}`}><Eye className="h-4 w-4"/></button>
                            </div>
                        ))}
                        {remainingParticipants > 0 && (
                            <button type="button" onClick={() => setVisibleParticipants((count) => Math.min(count + 5, participantRecords.length))} className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-xs font-black text-brand transition-colors hover:bg-brand-xlight">
                                <ChevronDown className="h-4 w-4"/> +{remainingParticipants} warga lainnya
                            </button>
                        )}
                    </div>
                </div>
            )}

            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby={`archive-participant-${item.id}`}>
                    <button type="button" aria-label="Tutup detail peserta" onClick={() => setSelectedParticipant(null)} className="absolute inset-0 cursor-default"/>
                    <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">{selectedParticipant.initials}</span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-brand">Detail Partisipasi Warga</p>
                                    <h3 id={`archive-participant-${item.id}`} className="mt-1 truncate text-lg font-black text-slate-900">{selectedParticipant.name}</h3>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-400">{selectedParticipant.role}</p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="hidden items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark sm:inline-flex"><CheckCircle2 className="h-3.5 w-3.5"/> Terverifikasi</span>
                                <button type="button" onClick={() => setSelectedParticipant(null)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup"><X className="h-4 w-4"/></button>
                            </div>
                        </div>

                        <div className="space-y-6 p-5 sm:p-6">
                            <section>
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-black text-slate-900">Checklist Tugas</h4>
                                    <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark">{checklistItems.length}/{checklistItems.length} selesai</span>
                                </div>
                                <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                    {checklistItems.map((checklistItem) => (
                                        <li key={checklistItem} className="flex items-start gap-3 bg-white p-3.5">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand"/>
                                            <span className="flex-1 text-xs font-semibold leading-relaxed text-slate-700">{checklistItem}</span>
                                            <span className="shrink-0 text-xs font-bold text-brand">Selesai</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section>
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-black text-slate-900">Bukti Foto</h4>
                                    <span className="inline-flex items-center gap-1 text-xs font-black text-brand"><FileCheck2 className="h-3.5 w-3.5"/> Terverifikasi</span>
                                </div>
                                <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                    <img src={selectedParticipant.photo} alt={`Bukti ${selectedParticipant.proofLabel.toLowerCase()} oleh ${selectedParticipant.name}`} className="aspect-video w-full object-cover"/>
                                    <figcaption className="flex items-center justify-between gap-3 bg-white p-3">
                                        <span className="text-xs font-semibold text-slate-600">{selectedParticipant.proofLabel}</span>
                                        <time className="text-right text-xs font-bold text-slate-400">{selectedParticipant.completedAt}</time>
                                    </figcaption>
                                </figure>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}

function EmergencyArchiveCard({ item }) {
    const [expanded, setExpanded] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const resolutionPhoto = item.photos?.[0] || communityProofPhotos[0];
    const residentPhoto = item.residentPhoto || communityProofPhotos[1];
    const verificationLogs = item.verificationLogs || [
        `Hotline 112 menerima eskalasi untuk ${item.location}`,
        'Petugas lapangan mengonfirmasi penanganan di lokasi',
        `${item.closedAt} · Bukti dan catatan diverifikasi Ketua PKK`,
    ];
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-brand-light bg-brand-xlight px-5 py-3 sm:px-6">
                <p className="flex items-center gap-2 text-xs font-black text-brand-dark"><Siren className="h-4 w-4"/> Jalur A · Laporan Darurat</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-black text-white"><CheckCircle2 className="h-3.5 w-3.5"/> Tuntas</span>
            </div>

            <div className="grid lg:grid-cols-2">
                <section className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark">Selesai</span>
                        <span className="font-mono text-xs font-bold text-slate-400">#{item.id}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-black leading-snug text-slate-900">{item.title}</h2>
                    <p className="mt-2 flex items-start gap-1.5 text-sm font-bold text-slate-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand"/> {item.location}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Pelapor</dt>
                            <dd className="mt-1 text-xs font-black text-slate-800">{item.reporter}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Kategori</dt>
                            <dd className="mt-1 text-xs font-black text-slate-800">{item.category}</dd>
                        </div>
                    </dl>

                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <button type="button" onClick={() => setDetailsOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50" aria-expanded={detailsOpen}>
                            <span className="flex items-center gap-2 text-xs font-black text-slate-800"><ClipboardList className="h-4 w-4 text-brand"/> Detail Laporan &amp; Bukti Warga</span>
                            <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', detailsOpen && 'rotate-180')}/>
                        </button>
                        {detailsOpen && (
                            <div className="border-t border-slate-100 p-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Deskripsi kejadian</p>
                                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{item.details || 'Laporan awal warga telah diverifikasi dan diteruskan melalui jalur darurat.'}</p>
                                </div>
                                <figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                    <img src={residentPhoto} alt={`Bukti awal warga untuk ${item.title}`} className="aspect-video w-full object-cover"/>
                                    <figcaption className="flex items-center justify-between gap-3 bg-white p-3">
                                        <span className="text-xs font-semibold text-slate-600">Bukti foto warga · kondisi awal</span>
                                        <span className="font-mono text-xs text-slate-400">#{item.id}</span>
                                    </figcaption>
                                </figure>
                            </div>
                        )}
                    </div>
                </section>

                <section className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-900">Ringkasan Penyelesaian</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-black text-brand-dark"><FileCheck2 className="h-3.5 w-3.5"/> Terverifikasi</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{item.fieldNote || item.resolution}</p>
                    <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold text-slate-400">Jalur eskalasi</p>
                            <p className="mt-1 text-xs font-black text-slate-800">Hotline 112 · BPBD Jakarta Selatan</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Waktu selesai</p>
                            <p className="mt-1 text-xs font-black text-slate-800">{item.closedAt}</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => setExpanded((open) => !open)} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition-colors hover:bg-slate-50" aria-expanded={expanded}>
                        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')}/> {expanded ? 'Tutup Log Resolusi' : 'Lihat Log Resolusi'}
                    </button>
                </section>
            </div>

            {expanded && (
                <div className="grid gap-5 border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:grid-cols-2">
                    <section>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-black text-slate-900">Bukti Foto Penyelesaian</h3>
                            <span className="text-xs font-black text-brand">Terverifikasi</span>
                        </div>
                        <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <img src={resolutionPhoto} alt={`Bukti penyelesaian ${item.title}`} className="aspect-video w-full object-cover"/>
                            <figcaption className="flex items-center justify-between gap-3 p-3">
                                <span className="truncate text-xs font-semibold text-slate-600">{item.proofName || 'Bukti penanganan akhir'}</span>
                                <time className="shrink-0 text-xs font-bold text-slate-400">{item.closedAt}</time>
                            </figcaption>
                        </figure>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><Clock3 className="h-4 w-4 text-brand"/> Jejak Eskalasi Resmi</h3>
                        <div className="mt-3 space-y-2">
                            {verificationLogs.map((log) => (
                                <div key={log} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"/>
                                    <p className="text-xs font-semibold leading-relaxed text-slate-600">{log}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </article>
    );
}

function ProofModal({ record, onClose }) {
    if (!record)
        return null;
    const photos = record.photos || [];
    const logs = record.verificationLogs || [
        `${record.closedAt} · Dokumentasi diterima`,
        `${record.closedAt} · Bukti diperiksa petugas wilayah`,
        `${record.closedAt} · Riwayat ditutup dan diarsipkan`,
    ];
    const fieldNote = record.fieldNote || record.resolution || `${record.impact}. Seluruh bukti kegiatan telah diperiksa dan dinyatakan lengkap.`;
    const proofLabels = record.archiveType === 'emergency'
        ? ['Kondisi lokasi', 'Hasil penanganan']
        : ['Pelaksanaan kegiatan', 'Hasil akhir kegiatan'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="proof-modal-title">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                    <div>
                        <h2 id="proof-modal-title" className="font-black text-slate-900">{record.archiveType === 'emergency' ? 'Catatan Penanganan' : 'Lampiran Bukti Aksi'}</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-400">{record.title}</p>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup bukti"><X className="h-4 w-4"/></button>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                    <section>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-black text-slate-900">{record.archiveType === 'community' ? 'Lampiran Bukti' : 'Dokumentasi Foto'}</h3>
                            <span className="inline-flex items-center gap-1 text-xs font-black text-brand"><FileCheck2 className="h-3.5 w-3.5"/> Terverifikasi</span>
                        </div>
                        {record.archiveType === 'community' ? (
                            <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                {proofLabels.map((label, index) => (
                                    <div key={label} className="flex items-center gap-3 bg-white p-3">
                                        {photos[index] ? (
                                            <img src={photos[index]} alt={`${label} ${record.title}`} className="h-16 w-20 shrink-0 rounded-lg object-cover"/>
                                        ) : (
                                            <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Camera className="h-5 w-5"/></span>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-black text-slate-700">{label}</p>
                                            <p className="mt-1 font-mono text-xs text-slate-400">DOC-{record.id}-{index + 1}</p>
                                        </div>
                                        <span className="hidden items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark sm:inline-flex"><CheckCircle2 className="h-3.5 w-3.5"/> Terverifikasi</span>
                                    </div>
                                ))}
                            </div>
                        ) : photos.length > 0 ? (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {photos.map((photo, index) => (
                                    <figure key={`${photo}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                        <img src={photo} alt={`${proofLabels[index] || 'Dokumentasi penanganan'} ${record.title}`} className="aspect-video w-full object-cover"/>
                                        <figcaption className="p-3 text-xs font-bold text-slate-600">{proofLabels[index] || `Dokumentasi ${index + 1}`}</figcaption>
                                    </figure>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {proofLabels.map((label, index) => (
                                    <div key={label} className="flex aspect-video flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-center">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm"><Camera className="h-5 w-5"/></span>
                                        <p className="mt-3 text-xs font-black text-slate-700">{label}</p>
                                        <p className="mt-1 font-mono text-xs text-slate-400">DOC-{record.id}-{index + 1}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <section className="rounded-xl border border-slate-200 p-4">
                            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><ClipboardList className="h-4 w-4 text-brand"/> Catatan Lapangan</h3>
                            <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{fieldNote}</p>
                        </section>
                        <section className="rounded-xl border border-slate-200 p-4">
                            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><Clock3 className="h-4 w-4 text-brand"/> Log Verifikasi</h3>
                            <div className="mt-3 space-y-3">
                                {logs.map((log) => (
                                    <div key={log} className="flex gap-2 text-xs font-semibold leading-relaxed text-slate-600">
                                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"/>
                                        <span>{log}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function HandlingArchive() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const activeTab = searchParams.get('tab') === 'community' ? 'community' : 'emergency';
    const { reports } = useReportContext();
    const { aksi } = useAksiState();
    const exactLocations = {
    'LP-2024-089': `Depan RT 04 / RW 05, ${areaLabel}`,
    'LP-2024-088': `Permukiman RT 04 / RW 05, ${areaLabel}`,
    'LP-2024-087': `Area usaha RW 05, ${areaLabel}`,
    'LP-2024-086': `Jl. Melati RW 03, ${areaLabel}`,
    'LP-2024-085': `Lahan kosong RT 05 / RW 05, ${areaLabel}`,
    'LP-2024-082': `RT 02 / RT 04 / RT 05, ${areaLabel}`,
};
    const archivedReports = reports
        .filter((report) => report.handledBy === 'bpbd' && report.status === 'handled')
        .map((report) => ({
            id: report.id,
            title: report.title,
            details: report.details,
            category: report.aiCategory,
            location: exactLocations[report.id] || report.location || areaLabel,
            reporter: report.reporter,
            resolution: report.publicMessage || 'Laporan darurat telah selesai ditangani.',
            fieldNote: report.completionNotes || report.publicMessage || 'Lokasi telah diamankan dan penanganan dinyatakan tuntas.',
            proofName: report.proofName,
            photos: report.resolutionPhoto ? [report.resolutionPhoto] : [],
            verificationLogs: (report.timeline || []).map((item) =>
    `${item.label}${item.description ? ` · ${item.description}` : ''} · ${item.timestamp}`
),
            status: report.status,
            archiveType: 'emergency',
            closedAt: report.completedAt || report.date,
        }));
    const emergencyHistory = [...archivedReports, ...emergencySeed]
        .filter((item) => item.status === 'handled')
        .map((item) => ({ ...item, archiveType: 'emergency' }));
    const completedActions = aksi.filter((action) => action.status === 'selesai');
    const formatLogTime = (value) =>
    value
        ? new Date(value).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta',
          })
        : 'Waktu tidak tercatat';
    const communityHistory = [
        ...completedActions.map((action) => ({
            id: action.id,
            title: action.title,
            category: action.category,
            location: action.location,
            impact: `${action.achieved} ${action.unit} tercapai`,
            participants: action.participants,
            quota: action.quota,
            steps: action.steps,
            photos: Object.values(
  (action.evidences || [])
    .filter((evidence) =>
      evidence.status === 'diterima' &&
      evidence.photos?.length > 0
    )
    .reduce((latest, evidence) => {
      const current = latest[evidence.userId];

      if (
        !current ||
        new Date(evidence.submittedAt) >
          new Date(current.submittedAt)
      ) {
        latest[evidence.userId] = evidence;
      }

      return latest;
    }, {})
).map((evidence) => evidence.photos[0]),
            fieldNote: (action.evidences || [])
  .filter((evidence) => evidence.status === 'diterima')
  .map((evidence) => evidence.note)
  .filter(Boolean)
  .join(' | ') || 'Belum ada catatan bukti dari peserta.',
            verificationLogs: [
    ...(action.evidences || []).flatMap((evidence) => {
        const logs = [
            `Bukti dikirim oleh ${evidence.participantName || 'Peserta'} · ${formatLogTime(evidence.submittedAt)}`,
        ];

        if (evidence.status === 'diterima') {
            logs.push(
                `Bukti diterima dan diverifikasi · ${formatLogTime(evidence.verifiedAt)}`
            );
        }

        if (evidence.status === 'ditolak') {
            logs.push(
                `Bukti ditolak · ${formatLogTime(evidence.rejectedAt)}${evidence.rejectionReason ? ` · Alasan: ${evidence.rejectionReason}` : ''}`
            );
        }

        if (evidence.status === 'menunggu') {
            logs.push('Bukti masih menunggu verifikasi');
        }

        return logs;
    }),
    ...(action.completedAt
        ? [`Aksi dinyatakan selesai · ${formatLogTime(action.completedAt)}`]
        : []),
],
            archiveType: 'community',
            closedAt: action.completedAt
  ? new Date(action.completedAt).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
  : 'Waktu penyelesaian belum tersedia',
        })),
        ...archivedSeed.map((item, index) => ({
            ...item,
            quota: index === 0 ? 40 : 50,
            category: 'Aksi Lingkungan',
            location: 'Kel. Kebayoran Baru',
            fieldNote: `${item.impact}. Pelaksanaan kegiatan telah diperiksa dan ditutup oleh Ketua PKK.`,
            verificationLogs: ['Dokumentasi kegiatan diterima', 'Partisipasi warga diverifikasi', 'Dampak akhir disetujui Ketua PKK'],
            archiveType: 'community',
        })),
    ];
    const tabs = [
        { id: 'emergency', label: 'Jalur A - Laporan Darurat', count: emergencyHistory.length, icon: Siren },
        { id: 'community', label: 'Jalur B - Aksi Komunitas', count: communityHistory.length, icon: Users },
    ];
    const visibleHistory = activeTab === 'community' ? communityHistory : emergencyHistory;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
    <Link href="/admin/ai-assistant" className="inline-flex items-center gap-1.5 text-xs font-black text-brand hover:text-brand-dark">
        <ArrowLeft className="h-4 w-4"/> Kembali ke Asisten AI</Link>
    <Link href="/admin/ai-assistant/archive/report-history" className="text-xs font-bold text-brand underline underline-offset-4 hover:text-brand-dark"> Lihat Riwayat Laporan </Link>
</div>
                <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <h1 className="text-2xl font-black text-slate-900">Arsip Penanganan Laporan</h1>
                    <div className="rounded-xl border border-brand-light bg-brand-xlight px-4 py-2 text-xs font-bold text-brand-dark">{visibleHistory.length} riwayat</div>
                </div>
            </div>

            <div className="grid rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:grid-cols-2" role="tablist" aria-label="Jenis arsip">
                {tabs.map((tab) => (
                    <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => router.replace(`/admin/ai-assistant/archive?tab=${tab.id}`, {scroll: false})} className={cn(
                        'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition-colors',
                        activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    )}>
                        <tab.icon className="h-4 w-4"/>
                        {tab.label}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tab.count}</span>
                    </button>
                ))}
            </div>

            <section className="space-y-4">
                {activeTab === 'emergency'
                    ? visibleHistory.map((item) => <EmergencyArchiveCard key={item.id} item={item}/>)
                    : visibleHistory.map((item) => <CommunityArchiveCard key={item.id} item={item}/>)}
                {visibleHistory.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                        <ShieldCheck className="mx-auto h-9 w-9 text-brand"/>
                        <p className="mt-3 font-black text-slate-800">Belum ada riwayat terverifikasi</p>
                    </div>
                )}
            </section>
        </div>
    );
}
