"use client";

import { useState } from 'react';
import { MapPin, UserRound, Eye, X } from 'lucide-react';
import { useReportContext } from '@/context/ReportContext';

export default function ReportHistory() {
const { reports } = useReportContext();
const historyReports = reports.filter(
(report) => report.dashboardDecision
);
const [activeTab, setActiveTab] = useState('all');
const [selectedReport, setSelectedReport] = useState(null);

const tabs = [
    { id: 'all', label: 'Semua' },
    { id: 'emergency', label: 'Jalur A' },
    { id: 'community', label: 'Jalur B' },
    { id: 'rejected', label: 'Ditolak' },
];

const filteredReports = historyReports.filter((report) => {
    if (activeTab === 'emergency') return report.dashboardRoute === 'emergency';
    if (activeTab === 'community') return report.dashboardRoute === 'community';
    if (activeTab === 'rejected') return report.dashboardDecision === 'rejected';
    return true;
});

const getDecisionLabel = (report) => {
    if (report.dashboardDecision === 'rejected') return 'Ditolak';
    if (report.dashboardDecision === 'overridden') return 'Override';
    return 'Diterima';
};

const getStatusLabel = (status) => {
    const labels = {
        pending: 'Menunggu penanganan',
        in_progress: 'Sedang ditangani',
        handled: 'Selesai',
        rejected: 'Ditolak',
    };
    return labels[status] || 'Belum diperbarui';
};

return (
    <div className="mx-auto max-w-7xl space-y-5">
        <div>
            <h1 className="text-2xl font-black text-slate-900">
                Riwayat Laporan
            </h1>
            <p className="mt-1 text-xs text-slate-500">
                Catatan keputusan dan perkembangan penanganan laporan warga.
            </p>
            <p className="mt-2 text-xs font-bold text-slate-600">
                {historyReports.length} laporan tercatat
            </p>
        </div>

        <div className="grid grid-cols-4 rounded-xl border border-slate-200 bg-slate-100 p-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-2 py-2.5 text-xs font-black transition-colors ${
                        activeTab === tab.id
                            ? 'bg-white text-brand shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    {tab.label}
                    <span className="ml-1 text-[10px] text-slate-400">
                        {tab.id === 'all'
                            ? historyReports.length
                            : historyReports.filter((report) =>
                                tab.id === 'rejected'
                                    ? report.dashboardDecision === 'rejected'
                                    : report.dashboardRoute === tab.id
                            ).length}
                    </span>
                </button>
            ))}
        </div>

        <section className="space-y-2.5">
            {filteredReports.map((report) => (
                <article
                    key={report.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-400">
                                {report.id}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                report.dashboardDecision === 'rejected'
                                    ? 'bg-red-50 text-red-700'
                                    : report.dashboardRoute === 'emergency'
                                        ? 'bg-orange-50 text-orange-700'
                                        : 'bg-brand-light text-brand-dark'
                            }`}>
                                {report.dashboardDecision === 'rejected'
                                    ? 'Ditolak'
                                    : report.dashboardRoute === 'emergency'
                                        ? 'Jalur A'
                                        : 'Jalur B'}
                            </span>
                            {report.dashboardDecision === 'overridden' && (
                                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                    Override
                                </span>
                            )}
                        </div>

                        <h2 className="mt-1.5 truncate text-sm font-bold text-slate-800">
                            {report.title}
                        </h2>

                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {report.area || 'Wilayah belum tersedia'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <UserRound className="h-3 w-3" />
                                {report.reporter || 'Pelapor tidak tersedia'}
                            </span>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] font-bold text-slate-400">
                                Status penanganan
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-slate-700">
                                {getStatusLabel(report.status)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-brand hover:bg-brand-xlight hover:text-brand"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat Detail
                        </button>
                    </div>
                </article>
            ))}

            {filteredReports.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-xs text-slate-500">
                    Belum ada laporan pada kategori ini.
                </div>
            )}
        </section>
        {selectedReport && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-slate-500">
                        {selectedReport.id}
                    </p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">
                        {selectedReport.title}
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Tutup detail"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="mt-6 max-h-[60vh] overflow-y-auto">
    <h3 className="mb-5 text-sm font-black text-slate-800">
        Riwayat Aktivitas
    </h3>

    {selectedReport?.timeline?.length > 0 ? (
        <div className="space-y-5">
            {selectedReport.timeline.map((item, index) => (
                <div key={item.id || index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-brand" />
                        {index !== selectedReport.timeline.length - 1 && (
                            <div className="mt-1 h-full w-px bg-slate-200" />
                        )}
                    </div>

                    <div className="pb-2">
                        <p className="text-sm font-bold text-slate-800">
                            {item.label}
                        </p>

                        {item.description && (
                            <p className="mt-1 text-xs text-slate-600">
                                {item.description}
                            </p>
                        )}

                        <p className="mt-1 text-[11px] text-slate-400">
                            {item.timestamp}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <p className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
            Belum ada aktivitas yang tercatat.
        </p>
    )}
</div>

        </div>
    </div>
)}
    </div>
);

}