"use client";
import { useMemo, useState } from 'react';
import {
    Archive, ArrowLeft, ArrowRight, CalendarDays, Camera, CheckCircle2, ChevronDown,
    ChevronUp, Circle, ClipboardList, Clock3, Eye, FileCheck2, LockKeyhole, MapPin,
    ShieldCheck, Sparkles, Target, Users, X,
} from 'lucide-react';
import Link from "next/link";
import { cn } from '@/lib/utils';
import { useReportContext } from '@/context/ReportContext';
import { markComplete, pct, useAksiState, approveFirstPending, rejectEvidence, getCompletedChecklistTotal, } from '@/lib/aksiStore';
import { areaLabel } from '@/lib/currentUser';

export const archivedSeed = [
    { id: 'archive-01', title: 'Kerja Bakti Bersihkan Taman RW 05', impact: '1 taman selesai dipulihkan', participants: 36, closedAt: '18 Oktober 2026' },
    { id: 'archive-02', title: 'Pilah Sampah Bersama RT 04', impact: '42 keluarga terverifikasi', participants: 42, closedAt: '12 Oktober 2026' },
];

export function buildSavings(reports) {
    console.table(
        reports.map((report) => ({
            id: report.id,
            handledBy: report.handledBy,
            dashboardDecision: report.dashboardDecision,
            dashboardRoute: report.dashboardRoute,
            overrideFrom: report.overrideFrom,
            urgency: report.urgency,
            status: report.status,
        }))
    );
    // Lanjutkan kode yang sudah ada
    const grouped = new Map();

    reports
        .filter((report) =>
            report.handledBy === 'community' &&
            ['accepted', 'overridden'].includes(report.dashboardDecision) &&
            report.status !== 'handled' &&
            report.status !== 'rejected'
        )
        .forEach((report) => {
            const category = (report.aiCategory || 'Kategori lainnya')
                .split('/')[0]
                .trim();

            const isEmergencyOverride =
                report.dashboardDecision === 'overridden' &&
                report.dashboardRoute === 'community' &&
                report.overrideFrom === 'bpbd';

            const key = isEmergencyOverride
                ? `override-${report.id}`
                : `${areaLabel}|${category}`;

            const current = grouped.get(key) ?? {
                key,
                area: areaLabel,
                category,
                reports: [],
                points: 0,
                target: 10,
            };

            current.reports.push(report);
            current.points = Math.min(
                current.target,
                current.points + (Number(report.urgency) || 0)
            );

            grouped.set(key, current);
        });

    return [...grouped.values()];
}

const actionReportScope = {
    'biopori-rw05': {
        reportId: 'LP-2024-091',
        reportTitle: 'Usulan Penanaman Biopori Bersama',
        displayTitle: 'Buat Lubang Biopori di RW 05',
        location: 'Permukiman RT 05 / RW 05',
        summary: 'Menjawab usulan warga untuk memperluas titik resapan air di lingkungan RW 05.',
    },
    'pilah-sampah-7-hari': {
        reportId: 'LP-2024-093',
        reportTitle: 'Usulan Gerakan Bank Sampah Tingkat RW',
        displayTitle: 'Pilah Sampah Rumah Tangga 7 Hari di RW 06',
        location: 'Permukiman RW 06',
        summary: 'Tahap awal gerakan bank sampah melalui kebiasaan memilah sampah dari rumah.',
    },
    'kerja-bakti-selokan': {
        reportId: 'LP-2024-090',
        reportTitle: 'Tumpukan Sampah di Saluran Lingkungan',
        displayTitle: 'Kerja Bakti Bersihkan Saluran RW 03',
        location: 'Jl. Panglima Polim V, RT 02 / RW 03',
        summary: 'Menindaklanjuti laporan saluran tersumbat agar aliran air kembali lancar.',
    },
};

const residentProofPhotos = {
    'biopori-rw05': [
        'https://images.unsplash.com/photo-1597868165956-03a6827955b1?auto=format&fit=crop&w=480&q=80',
        'https://images.unsplash.com/photo-1557296691-edb10ad8da28?auto=format&fit=crop&w=480&q=80',
        'https://images.unsplash.com/photo-1719701285590-68cac7ad9a49?auto=format&fit=crop&w=480&q=80',
    ],
    'pilah-sampah-7-hari': [
        'https://images.unsplash.com/photo-1790579941313-29964bfd626a?auto=format&fit=crop&w=480&q=80',
        'https://images.unsplash.com/photo-1771172195332-3bc9ded9f3b5?auto=format&fit=crop&w=480&q=80',
        'https://images.unsplash.com/photo-1782254346978-a79a0dc2a80e?auto=format&fit=crop&w=480&q=80',
    ],
    'kerja-bakti-selokan': [
        'https://images.unsplash.com/photo-1733388972592-ec1da2ddc432?auto=format&fit=crop&w=480&q=80',
        'https://images.unsplash.com/photo-1622123651884-e3d30eebfbff?auto=format&fit=crop&w=480&q=80',
        'https://images.unsplash.com/photo-1643216665710-9e254ce24f82?auto=format&fit=crop&w=480&q=80',
    ],
};

const residentDirectory = [
    ['Ahmad Rahman', 'Ketua RT 04'],
    ['Dewi Lestari', 'Relawan warga'],
    ['Siti Aminah', 'Anggota PKK'],
    ['Nur Hidayah', 'Relawan warga'],
    ['Rina Wulandari', 'Anggota PKK'],
    ['Budi Santoso', 'Warga'],
    ['Yuni Kartika', 'Anggota PKK'],
    ['Taufik Hidayat', 'Warga'],
    ['Sri Wahyuni', 'Relawan warga'],
];

function buildCollectiveChecklistCounts(totalParticipants, checklistCount, completedChecklistTotal) {
    if (!checklistCount)
        return [];
    const totalChecklistTarget = totalParticipants * checklistCount;
    const targetCompleted = Math.max(0, Math.min(totalChecklistTarget, completedChecklistTotal));
    const progress = pct(targetCompleted, totalChecklistTarget);
    const center = (checklistCount - 1) / 2;
    const counts = Array.from({ length: checklistCount }, (_, index) => {
        const weightedProgress = progress + (center - index) * 12;
        return Math.max(0, Math.min(totalParticipants, Math.round(totalParticipants * weightedProgress / 100)));
    });
    let currentCompleted = counts.reduce((total, count) => total + count, 0);
    let cursor = 0;
    while (currentCompleted < targetCompleted) {
        const index = cursor % checklistCount;
        if (counts[index] < totalParticipants) {
            counts[index] += 1;
            currentCompleted += 1;
        }
        cursor += 1;
    }
    cursor = 0;
    while (currentCompleted > targetCompleted) {
        const index = checklistCount - 1 - (cursor % checklistCount);
        if (counts[index] > 0) {
            counts[index] -= 1;
            currentCompleted -= 1;
        }
        cursor += 1;
    }
    return counts;
}

function SavingsCard({ clusters }) {
    return (
        <Link href="/admin/actions/savings" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="font-black text-slate-900">Tabungan Aksi</h2>
                    <p className="mt-3 text-3xl font-black text-amber-700">{clusters.length}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">klaster aktif</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Sparkles className="h-5 w-5"/></span>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-xs font-black text-amber-700">Buka Tabungan Aksi <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
        </Link>
    );
}

function HistoryCard({ completed }) {
    const historyCount = completed.length + archivedSeed.length;
    return (
        <Link href="/admin/ai-assistant/archive?tab=community" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-light hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="font-black text-slate-900">Riwayat Aksi</h2>
                    <p className="mt-3 text-3xl font-black text-brand">{historyCount}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">aksi selesai</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-xlight text-brand"><Archive className="h-5 w-5"/></span>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-xs font-black text-brand">Buka Riwayat Aksi <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
        </Link>
    );
}

function ActiveActionCard({ action, expanded, onToggle, onComplete }) {
    const [selectedProof, setSelectedProof] = useState(null);
    const [overviewOpen, setOverviewOpen] = useState(false);
    const [visibleParticipants, setVisibleParticipants] = useState(5);
    const [rejectionReason, setRejectionReason] = useState('');
    const scope = actionReportScope[action.id];
    const participants = action.participantList || [];
    const tasks = action.tasks || [];

// Total checklist target = target warga × jumlah tugas
    const collectiveTotal = action.quota * tasks.length;

// Hitung checklist selesai untuk setiap tugas
const collectiveChecklistCounts = tasks.map((task) =>
    participants.filter((participant) =>
        participant.checklist?.some(
            (item) =>
                item.taskId === task.id &&
                item.status === 'selesai'
        )
    ).length
);

// Akumulasi seluruh checklist yang telah diselesaikan
const collectiveCompleted = getCompletedChecklistTotal(action);

const overallProgress = collectiveTotal > 0
    ? pct(collectiveCompleted, collectiveTotal)
    : 0;

    const residentProofs = participants.map((participant) => {
    const participantEvidence = (action.evidences || [])
        .filter((evidence) => evidence.userId === participant.userId);

    const completedTaskIds = (participant.checklist || [])
        .filter((item) => item.status === 'selesai')
        .map((item) => item.taskId);

    const completedItems = tasks
        .filter((task) => completedTaskIds.includes(task.id))
        .map((task) => task.title);

    const latestEvidence = participantEvidence.at(-1);

    const initials = participant.name
        .replace(/^(Ibu|Bapak|Bu)\s+/, '')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return {
        ...participant,
        role: participant.role || 'Anggota PKK',
        initials,
        evidences: participantEvidence,
        photo: latestEvidence?.photos?.[0] || null,
        verified: latestEvidence?.status === 'diterima',
        checklistComplete:
            tasks.length > 0 &&
            completedTaskIds.length === tasks.length,
        completedItems,
        caption: latestEvidence?.note || null,
        evidenceStatus: latestEvidence?.status || 'belum_upload',
        evidenceId: latestEvidence?.id || null,
        rejectionReason: latestEvidence?.rejectionReason || null,
    };
});

    const shownParticipants = residentProofs.slice(0, visibleParticipants);
    const remainingParticipants = residentProofs.length - shownParticipants.length;
    const submittedProofs = residentProofs.filter((proof) => proof.verified).length;
    const proofProgress = action.quota > 0
    ? Math.min(100, pct(submittedProofs, action.quota))
    : 0;
    const toggleProgress = () => {
        if (expanded)
            setVisibleParticipants(5);
        onToggle();
    };

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-3 lg:items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark">Aktif</span>
                        <span className="text-xs font-bold text-slate-400">{action.category}</span>
                    </div>
                    <h2 className="mt-3 text-base font-black leading-snug text-slate-900">{scope?.displayTitle || action.title}</h2>
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"/> {scope?.location || action.location || action.schedule?.place || '-'} </p>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-400">Partisipasi warga</span>
                        <p className="text-xs font-bold text-slate-600"><span className="font-black text-slate-900">{action.participants}</span>/{action.quota} peserta</p>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-slate-500"><span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-blue-500"/> Bukti warga terverifikasi</span><span>{submittedProofs}/{action.quota} · {proofProgress}%</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${proofProgress}%` }}/></div>
                    </div>
                    <div className="mt-3">
                        <div className="flex justify-between text-xs font-bold text-slate-500"><span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-brand"/> Progres aksi</span><span>{collectiveCompleted}/{collectiveTotal} · {overallProgress}%</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${overallProgress}%` }}/></div>
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    <button type="button" onClick={() => setOverviewOpen(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">
                        <ClipboardList className="h-4 w-4"/> Ringkasan Aksi
                    </button>
                    <button type="button" onClick={toggleProgress} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50" aria-expanded={expanded}>
                        {expanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>} {expanded ? 'Tutup Peserta' : 'Lihat Peserta'}
                    </button>
                    <button type="button" onClick={() => onComplete(action)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-black text-white hover:bg-brand-dark">
                    <CheckCircle2 className="h-4 w-4"/> Tandai Selesai
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-6">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-black text-slate-800">Partisipasi Warga</p>
                            <p className="mt-1 text-xs text-slate-400">Pilih warga untuk melihat checklist dan bukti penyelesaian.</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400"><FileCheck2 className="h-3.5 w-3.5"/> {submittedProofs} pengajuan terbaru dari {action.participants} peserta</span>
                    </div>
                    <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {shownParticipants.map((proof) => (
                            <div key={proof.name} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{proof.initials}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-black text-slate-800">{proof.name}</span>
                                    <span className="mt-0.5 block text-xs text-slate-400">{proof.role} · {proof.evidences.length > 0 ? 'Sudah mengirim bukti kegiatan' : 'Belum mengirim bukti kegiatan'}</span>
                                </span>
                                {proof.evidenceStatus === 'menunggu' ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
        <Clock3 className="hidden h-3.5 w-3.5 sm:block"/>
        Menunggu Verifikasi
    </span>
) : proof.evidenceStatus === 'ditolak' ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">
        <X className="hidden h-3.5 w-3.5 sm:block"/>
        Ditolak
    </span>
) : proof.evidenceStatus === 'diterima' ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark">
        <CheckCircle2 className="hidden h-3.5 w-3.5 sm:block"/>
        Terverifikasi
    </span>
) : proof.completedItems.length === 0 ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
        <Clock3 className="hidden h-3.5 w-3.5 sm:block"/>
        Belum Mulai
    </span>
) : proof.checklistComplete ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
        <CheckCircle2 className="hidden h-3.5 w-3.5 sm:block"/>
        Siap Kirim Bukti
    </span>
) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
        <Clock3 className="hidden h-3.5 w-3.5 sm:block"/>
        Dalam Proses
    </span>
)}
                                <button type="button" onClick={() => setSelectedProof(proof)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors group-hover:border-brand-light hover:bg-brand-xlight hover:text-brand" aria-label={`Lihat progres ${proof.name}`}><Eye className="h-4 w-4"/></button>
                            </div>
                        ))}
                        {remainingParticipants > 0 && (
                            <button type="button" onClick={() => setVisibleParticipants((count) => Math.min(count + 5, residentProofs.length))} className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-xs font-black text-brand transition-colors hover:bg-brand-xlight">
                                <ChevronDown className="h-4 w-4"/> +{remainingParticipants} warga lainnya
                            </button>
                        )}
                    </div>
                </div>
            )}

            {overviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby={`overview-${action.id}`}>
                    <button type="button" aria-label="Tutup ringkasan aksi" onClick={() => setOverviewOpen(false)} className="absolute inset-0 cursor-default"/>
                    <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-brand">Ringkasan Aksi Komunitas</p>
                                <h3 id={`overview-${action.id}`} className="mt-1 text-lg font-black text-slate-900">{scope?.displayTitle || action.title}</h3>
                                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400"><MapPin className="h-3.5 w-3.5 text-brand"/> {scope?.location || action.location || action.schedule?.place || '-'} </p>
                            </div>
                            <button type="button" onClick={() => setOverviewOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup"><X className="h-4 w-4"/></button>
                        </div>

                        <div className="space-y-6 p-5 sm:p-6">
                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                <div className="max-w-xl">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Deskripsi Kegiatan</p>
                                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{action.objective}</p>
                                    {scope?.summary && <p className="mt-2 text-xs leading-relaxed text-slate-500">{scope.summary}</p>}
                                </div>
                                <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                                    <div className="flex items-start gap-2">
                                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand"/>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400">Pelaksanaan</p>
                                            <p className="mt-0.5 text-xs font-black text-slate-700">{action.schedule.date}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{action.schedule.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand"/>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400">Titik kumpul</p>
                                            <p className="mt-0.5 text-xs font-black text-slate-700">{action.schedule.place}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand"/>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400">Target partisipasi</p>
                                            <p className="mt-0.5 text-xs font-black text-slate-700">{action.quota} warga</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{action.participants} telah bergabung</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">Progres Checklist Kolektif</h4>
                                    </div>
                                    <div className="rounded-xl border border-brand-light bg-brand-xlight px-3 py-2 text-right">
                                        <p className="text-xs font-black text-brand-dark">{collectiveCompleted}/{collectiveTotal} penyelesaian</p>
                                        <p className="mt-0.5 text-xs text-brand">{overallProgress}% progres keseluruhan</p>
                                    </div>
                                </div>

                                <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                    {tasks.map((task, index) => {
    const completedCount = collectiveChecklistCounts[index];

    const itemProgress = action.quota > 0
        ? Math.min(100, pct(completedCount, action.quota))
        : 0;

    return (
        <div key={task.id} className="bg-white p-4">
            <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                    {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                        <p className="text-xs font-bold leading-relaxed text-slate-700">
                            {task.title}
                        </p>

                        <span className="shrink-0 text-xs font-black text-slate-800">
                            {completedCount}/{action.quota} warga selesai
                        </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${itemProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
})}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {selectedProof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby={`proof-${action.id}`}>
                    <button type="button" aria-label="Tutup detail pengajuan" onClick={() => setSelectedProof(null)} className="absolute inset-0 cursor-default"/>
                    <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">{selectedProof.initials}</span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-brand">Detail Partisipasi Warga</p>
                                    <h3 id={`proof-${action.id}`} className="mt-1 truncate text-lg font-black text-slate-900">{selectedProof.name}</h3>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-400">{selectedProof.role}</p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className={cn(
                                    'hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black sm:inline-flex',
                                    selectedProof.verified
                                        ? 'bg-brand-light text-brand-dark'
                                        : selectedProof.completedItems.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                )}>
                                    {selectedProof.verified ? <CheckCircle2 className="h-3.5 w-3.5"/> : <Clock3 className="h-3.5 w-3.5"/>}
                                    {selectedProof.verified ? 'Terverifikasi' : selectedProof.completedItems.length > 0 ? 'Dalam proses' : 'Belum mulai'}
                                </span>
                                <button type="button" onClick={() => setSelectedProof(null)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup"><X className="h-4 w-4"/></button>
                            </div>
                        </div>
                        <div className="space-y-6 p-5 sm:p-6">
                            <section>
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">Checklist Tugas</h4>
                                        <p className="mt-1 text-xs text-slate-400">Progres individual peserta untuk aksi ini.</p>
                                    </div>
                                    <span className={cn(
                                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-black',
                                        selectedProof.checklistComplete ? 'bg-brand-light text-brand-dark' : 'bg-amber-100 text-amber-700'
                                    )}>{selectedProof.completedItems.length}/{action.tasks.length} selesai</span>
                                </div>
                                <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                    {action.tasks.map((item, index) => {
                                        const completed = selectedProof.completedItems.includes(item.title);
                                        return (
                                            <li key={item.id} className="flex items-start gap-3 bg-white p-3.5">
                                                {completed
                                                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand"/>
                                                    : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300"/>}
                                                <span className={cn('flex-1 text-xs font-semibold leading-relaxed', completed ? 'text-slate-700' : 'text-slate-400')}>{item.title}</span>
                                                <span className={cn('shrink-0 text-xs font-bold', completed ? 'text-brand' : 'text-slate-400')}>{completed ? 'Selesai' : 'Menunggu'}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>

                            {selectedProof.evidenceStatus !== 'belum_upload' ? (
                                <section>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900">Bukti Foto</h4>
                                            <p className="mt-1 text-xs text-slate-400">Dokumentasi akhir kegiatan yang dikirim peserta.</p>
                                        </div>
                                        {selectedProof.evidenceStatus === 'diterima' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-black text-brand">
                                                <FileCheck2 className="h-3.5 w-3.5"/> Terverifikasi
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3">
    <span className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
        selectedProof.evidenceStatus === 'menunggu'
            ? 'bg-amber-100 text-amber-700'
            : selectedProof.evidenceStatus === 'diterima'
                ? 'bg-brand-light text-brand-dark'
                : 'bg-rose-100 text-rose-700'
    )}>
        {selectedProof.evidenceStatus === 'menunggu'
            ? 'Menunggu Verifikasi'
            : selectedProof.evidenceStatus === 'diterima'
                ? 'Bukti Diterima'
                : 'Bukti Ditolak'}
    </span>
</div>
{selectedProof.evidenceStatus === 'ditolak' && selectedProof.rejectionReason && (
  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
    <p className="text-xs font-black text-rose-800">Alasan penolakan</p>
    <p className="mt-1 text-xs leading-relaxed text-rose-700">
      {selectedProof.rejectionReason}
    </p>
  </div>
)}
                                    {selectedProof.photo ? (
                                    <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                        <img src={selectedProof.photo} alt={`Bukti aksi yang diunggah oleh ${selectedProof.name}`} className="aspect-video w-full object-cover"/>
                                        <figcaption className="bg-white p-3 text-xs font-semibold text-slate-600">{selectedProof.caption}</figcaption>
                                    </figure>
                                    ) : (
                                        <div className="mt-3 flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                                            <Camera className="h-6 w-6 text-slate-300"/>
                                            <p className="mt-2 text-xs font-bold text-slate-500">Belum mengunggah foto</p>
                                        </div>
                                    )}
                                    {selectedProof.evidenceStatus === 'menunggu' && (
    <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h4 className="text-sm font-black text-slate-800">
            Verifikasi Bukti Kegiatan
        </h4>

        <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Tuliskan alasan penolakan bukti..."
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />

        <div className="flex flex-wrap justify-end gap-2">
            <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={() => {
                    const success = rejectEvidence(
                        action.id,
                        selectedProof.evidenceId,
                        rejectionReason.trim()
                    );

                    if (success) {
                        setSelectedProof(null);
                        setRejectionReason('');
                    }
                }}
                className="rounded-lg border border-rose-300 bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Tolak Bukti
            </button>

            <button
                type="button"
                onClick={() => {
                    const success = approveFirstPending(
                        action.id,
                        selectedProof.evidenceId
                    );

                    if (success) {
                        setSelectedProof(null);
                        setRejectionReason('');
                    }
                }}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-green-800"
            >
                Terima Bukti
            </button>
        </div>
    </div>
)}
                                </section>
                            ) : (
                                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"/>
                                    <div>
                                        <p className="text-xs font-black text-amber-800">Bukti foto belum tersedia</p>
                                        <p className="mt-1 text-xs leading-relaxed text-amber-700">Peserta harus menyelesaikan seluruh checklist sebelum dapat mengunggah bukti foto.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}

function ArchivedActionCard({ item }) {
    // Ambil bukti terakhir setiap peserta.
    // submitEvidence menambahkan bukti baru ke akhir array.
    const latestEvidenceByUser = new Map();

    (item.evidences || []).forEach((evidence) => {
        if (evidence.userId) {
            latestEvidenceByUser.set(evidence.userId, evidence);
        }
    });

    const verifiedParticipants = [...latestEvidenceByUser.values()]
        .filter((evidence) => evidence.status === 'diterima')
        .length;

    // Dibandingkan dengan target peserta.
    const evidenceProgress = item.quota > 0
        ? Math.min(100, Math.round(
            (verifiedParticipants / item.quota) * 100
        ))
        : 0;

    // Dibandingkan dengan jumlah peserta yang benar-benar bergabung.
    const verificationProgress = item.participants > 0
        ? Math.min(100, Math.round(
            (verifiedParticipants / item.participants) * 100
        ))
        : 0;

    // Progres berdasarkan checklist, bukan achieved/target.
    const totalChecklist = (item.quota || 0) * (item.taskCount || 0);
    const completedChecklist = Math.max(
        0,
        Math.min(totalChecklist, getCompletedChecklistTotal(item))
    );

    const actionProgress = totalChecklist > 0
        ? Math.round((completedChecklist / totalChecklist) * 100)
        : 0;

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">Selesai</span>
                        <span className="text-xs font-bold text-slate-400">{item.category}</span>
                    </div>
                    <h2 className="mt-3 text-base font-black leading-snug text-slate-900">{item.title}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-brand"/> {item.location}
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Partisipan</span>
                        <span className="text-slate-900">{item.participants} peserta</span>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-blue-500"/> Bukti foto
                            </span>
                            <span>{verifiedParticipants}/{item.quota || 0} · {evidenceProgress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${evidenceProgress}%` }} />
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Target className="h-3.5 w-3.5 text-brand"/> Progres aksi
                            </span>
                            <span>{completedChecklist}/{totalChecklist} · {actionProgress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${actionProgress}%` }}/>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">Dampak Akhir</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{item.impact}</p>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                        <span className="text-xs text-slate-400">{item.closedAt}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-black text-brand">
                            <FileCheck2 className="h-3.5 w-3.5"/> {verificationProgress}% Terverifikasi
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function ActionManagement() {
    const { reports, completeCommunityReports } = useReportContext();
    const { aksi } = useAksiState();
    const [expandedId, setExpandedId] = useState(null);
    const [confirmCompleteAction, setConfirmCompleteAction] = useState(null);
    const clusters = useMemo(() => buildSavings(reports), [reports]);
    const activeActions = aksi.filter((action) => action.status !== 'selesai');
    const completedActions = aksi.filter((action) => action.status === 'selesai');

    function handleCompleteAction(action) {
    if (action.status === 'selesai') return;

    setConfirmCompleteAction(action);
}

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Manajemen Aksi</h1>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <SavingsCard clusters={clusters}/>
                <HistoryCard completed={completedActions}/>
            </div>

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-black text-slate-900">Aksi Komunitas Aktif</h2>
                </div>

                {activeActions.length > 0 ? (
                    <div className="space-y-4">
                        {activeActions.map((action) => (
                            <ActiveActionCard
                                key={action.id}
                                action={action}
                                expanded={expandedId === action.id}
                                onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
                                onComplete={handleCompleteAction}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-brand"/>
                        <p className="mt-3 font-black text-slate-800">Semua aksi telah diselesaikan</p>
                        <p className="mt-1 text-sm text-slate-500">Aksi yang ditutup dapat dilihat pada Riwayat Aksi.</p>
                    </div>
                )}
            </section>
            {confirmCompleteAction && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">
                Selesaikan Aksi?
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Apakah kamu yakin ingin menyelesaikan aksi
                <span className="font-bold text-slate-900">
                    {' '}{confirmCompleteAction.title}
                </span>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => setConfirmCompleteAction(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                    Batal
                </button>

                <button
                    type="button"
                    onClick={() => {
                        const action = confirmCompleteAction;
                        markComplete(action.id);
                        completeCommunityReports(
                            action.sourceReportIds || [],
                            action.id,
                            action.title
                        );
                        setConfirmCompleteAction(null);
                    }}
                    className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-dark"
                >
                    Ya, Tandai Selesai
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}

export function ActionSavings() {
    const { reports } = useReportContext();
    const allClusters = useMemo(() => buildSavings(reports), [reports]);
const clusters = useMemo(() => {
    return allClusters.filter((cluster) => {
        const uniqueReporters = new Set(
            cluster.reports
                .map((report) => report.reporter?.trim().toLowerCase())
                .filter(Boolean)
        ).size;

        const hasEnoughPoints = cluster.points >= cluster.target;
        const hasEnoughReporters = uniqueReporters >= 3;

        const isEmergencyOverride = cluster.reports.some(
            (report) =>
                report.dashboardDecision === 'overridden' &&
                report.dashboardRoute === 'community' &&
                report.overrideFrom === 'bpbd'
        );

        const ready =
            isEmergencyOverride ||
            (hasEnoughPoints && hasEnoughReporters);

        return !ready;
    });
}, [allClusters]);

const [expandedClusterKey, setExpandedClusterKey] = useState(null);

const reportCount = clusters.reduce(
    (total, cluster) => total + cluster.reports.length,
    0
);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <Link href="/admin/actions" className="inline-flex items-center gap-1.5 text-xs font-black text-brand hover:text-brand-dark"><ArrowLeft className="h-4 w-4"/> Kembali ke Manajemen Aksi</Link>
                <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-amber-700">Praklasifikasi AI</p>
                        <h1 className="mt-1 text-2xl font-black text-slate-900">Tabungan Aksi</h1>
                        <p className="mt-1 text-sm text-slate-500">Laporan berkondisi serupa di wilayah yang sama diakumulasi menuju ambang pembentukan aksi.</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">{clusters.length} klaster · {reportCount} laporan aktif</div>
                </div>
            </div>

            <div className="rounded-2xl border border-brand-light bg-brand-xlight p-4">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-brand-dark"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/> Asisten AI telah mengelompokkan laporan berdasarkan kondisi, kategori, dan lokasi. Ketua PKK cukup meninjau draf akhir ketika ambang poin tercapai.</p>
            </div>

            {clusters.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {clusters.map((cluster) => {
                        const progress = pct(cluster.points, cluster.target);
                        const expanded = expandedClusterKey === cluster.key;
                        return (
                            <article key={cluster.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Sparkles className="h-5 w-5"/></span>
                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{cluster.points < cluster.target ? 'Mengumpulkan Poin' : 'Menunggu Minimal 3 Pelapor'}</span>
                                </div>
                                <h2 className="mt-4 font-black text-slate-900">{cluster.category}</h2>
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 text-brand"/> {cluster.area}</p>

                                <div className="mt-5">
                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Ambang pembentukan aksi</span><span>{cluster.points}/{cluster.target} poin</span></div>
                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${progress}%` }}/></div>
                                </div>

                                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                                    <button type="button" onClick={() => setExpandedClusterKey(expanded ? null : cluster.key)} className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100" aria-expanded={expanded}>
                                        <span className="text-xs font-black text-slate-700">{cluster.reports.length} laporan kontributor</span>
                                        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', expanded && 'rotate-180')}/>
                                    </button>
                                    {expanded && (
                                        <div className="divide-y divide-slate-100">
                                            {cluster.reports.map((report) => (
                                                <div key={report.id} className="flex items-center gap-3 bg-white p-3">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-black text-amber-700">+{report.urgency}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-black text-slate-800">{report.title}</p>
                                                        <p className="mt-0.5 font-mono text-xs text-slate-400">#{report.id}</p>
                                                    </div>
                                                    <span className="shrink-0 text-xs font-black text-amber-700">{report.urgency} poin</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-500">
    <Clock3 className="h-4 w-4"/>
    {cluster.points < cluster.target
        ? `Menunggu ${cluster.target - cluster.points} poin lagi`
        : `Menunggu ${3 - new Set(
            cluster.reports
                .map((report) => report.reporter?.trim().toLowerCase())
                .filter(Boolean)
        ).size} pelapor lagi`}
</div>
                            </article>
                        );
                    })}
                </div>
            ) : allClusters.length > 0 ? (
    <div className="rounded-2xl border border-brand-light bg-brand-xlight py-16 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand"/>
        <p className="mt-3 font-black text-slate-800">
            Semua klaster siap diproses
        </p>
        <p className="mt-1 text-sm text-slate-600">
            Klaster yang memenuhi syarat telah tersedia di Asisten AI Jalur B.
        </p>
        <Link
            href="/admin/ai-assistant"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-black text-white hover:bg-brand-dark"
        >
            Lihat Asisten AI <ArrowRight className="h-4 w-4"/>
        </Link>
    </div>
) : (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-amber-500"/>
        <p className="mt-3 font-black text-slate-800">Belum ada tabungan laporan</p>
        <p className="mt-1 text-sm text-slate-500">
            Klaster baru akan muncul setelah AI menemukan laporan dengan kondisi dan lokasi serupa.
        </p>
    </div>
)}
        </div>
    );
}

export function ActionHistory() {
    const { aksi } = useAksiState();
    const completed = aksi.filter((action) => action.status === 'selesai');
    const history = [
        ...completed.map((action) => ({
    id: action.id,
    title: action.title,
    category: action.category,
    location: action.location,
    impact: `${action.achieved} ${action.unit} tercapai`,
    participants: action.participants,
    participantList: action.participantList || [],
    quota: action.quota || 0,
    evidences: action.evidences || [],
    achieved: action.achieved || 0,
    target: action.target || 0,
    unit: action.unit || '',
    taskCount: action.tasks?.length || 0,
    closedAt: action.completedAt || 'Tanggal belum tersedia',
})),
        ...archivedSeed.map((item) => ({ ...item, category: 'Aksi Lingkungan', location: 'Kel. Kebayoran Baru' })),
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <Link href="/admin/actions" className="inline-flex items-center gap-1.5 text-xs font-black text-brand hover:text-brand-dark"><ArrowLeft className="h-4 w-4"/> Kembali ke Manajemen Aksi</Link>
                <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-brand">Arsip Terverifikasi</p>
                        <h1 className="mt-1 text-2xl font-black text-slate-900">Riwayat Aksi</h1>
                        <p className="mt-1 text-sm text-slate-500">Aksi komunitas yang telah mencapai tahap akhir dan ditutup oleh Ketua PKK.</p>
                    </div>
                    <div className="rounded-xl border border-brand-light bg-brand-xlight px-4 py-2 text-xs font-bold text-brand-dark">{history.length} aksi selesai</div>
                </div>
            </div>

            <div className="space-y-4">
                {history.map((item) => <ArchivedActionCard key={item.id} item={item}/>)}
            </div>
        </div>
    );
}