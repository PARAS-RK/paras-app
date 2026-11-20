"use client";

import { useState } from "react";
import {
    AlertTriangle, Camera, CheckCircle2, ChevronDown, Clock,
    MapPin, ShieldAlert, UserRound, Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useReportContext } from "@/context/ReportContext";
import { useAdminAksi } from "@/lib/adminAksi";
import { useAdmin } from "@/context/AdminContext";

function normalizeArea(value = "") {
    return String(value).replace(/^Kel\.\s*/i, "").trim().toLowerCase();
}

function MetricCard({ label, value, icon: Icon, tone, emergency }) {
    return (
        <article className={cn("rounded-2xl border bg-white p-5 shadow-sm", emergency ? "border-red-200" : "border-slate-200")}>
            <div className="flex items-start justify-between gap-3">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
                    <Icon className="h-5 w-5" />
                </span>
                {emergency && (
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-label="Memerlukan perhatian" />
                )}
            </div>
            <p className="mt-5 text-3xl font-black text-slate-900">{value}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
        </article>
    );
}

export default function AdminDashboard({ userCounts }) {
    const { areaLabel, areaFull } = useAdmin();
    const { reports, decideReport } = useReportContext();
    const { aksi } = useAdminAksi();

    const [expandedReportId, setExpandedReportId] = useState(null);
    const [decidingId, setDecidingId] = useState(null);
    const [notice, setNotice] = useState(null);
    const [rejectingReport, setRejectingReport] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const scopedReports = reports.filter((report) => {
        const reportArea = normalizeArea(report.area || report.regionLabel);
        return !reportArea || reportArea === normalizeArea(areaLabel);
    });

    // Dashboard hanya menampilkan laporan yang belum diambil keputusannya.
    const pendingReports = scopedReports.filter(
        (report) => report.status === "submitted" && !report.dashboardDecision
    );

    const filteredReports = pendingReports;

    const activeEmergency = scopedReports.filter(
        (report) =>
            report.dashboardRoute === "emergency" &&
            ["in_review", "in_progress"].includes(report.status)
    ).length;

    const completedActions = aksi.filter(
        (item) =>
            item.status === "selesai" &&
            normalizeArea(item.location) === normalizeArea(areaLabel)
    ).length;

    async function handleDecision(report, decision, reason = "") {
        if (decidingId) return;

        setDecidingId(report.id);
        setNotice(null);

        const result = await decideReport(report.id, decision, reason);

        if (result.success) {
            const message = {
                accept_a: "Laporan diterima melalui Jalur A dan masuk ke antrean Asisten AI.",
                accept_b: "Laporan diterima melalui Jalur B dan masuk ke Tabungan Aksi sesuai kategorinya.",
                reject: "Laporan ditolak. Alasan penolakan tampil di Pantau Lapor zona publik.",
            }[decision];

            setNotice({ tone: "success", title: "Keputusan tersimpan", message });
            setRejectingReport(null);
            setRejectionReason("");
            setExpandedReportId(null);
        } else {
            setNotice({
                tone: "error",
                title: "Keputusan gagal disimpan",
                message: result.message || "Silakan coba lagi.",
            });
        }

        setDecidingId(null);
    }

    function openRejectDialog(report) {
        setRejectingReport(report);
        setRejectionReason("");
        setNotice(null);
    }

    return (
        <div className="mx-auto max-w-7xl space-y-7">
            <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                        Tentukan jalur setiap laporan masuk di wilayah Anda.
                    </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
                    <MapPin className="h-3.5 w-3.5 text-brand" /> {areaFull || areaLabel}
                </span>
            </header>

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Ringkasan metrik">
                <Link href="/admin/manajemen-pengguna" aria-label="Buka Manajemen Pengguna">
                    <MetricCard label="Anggota PKK Aktif" value={userCounts?.pkk ?? 0} icon={Users} tone="bg-brand-xlight text-brand" />
                </Link>
                <MetricCard label="Warga Aktif" value={userCounts?.citizens ?? 0} icon={UserRound} tone="bg-blue-50 text-blue-600" />
                <MetricCard label="Laporan Jalur A Aktif" value={activeEmergency} icon={ShieldAlert} tone="bg-red-50 text-red-600" emergency />
                <MetricCard label="Aksi Selesai" value={completedActions} icon={CheckCircle2} tone="bg-brand-xlight text-brand" />
            </section>

            <section>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-black text-slate-900">Laporan Terbaru</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {pendingReports.length} laporan menunggu keputusan Ketua PKK.
                                </p>
                            </div>
                            <Link href="/admin/ai-assistant/archive/report-history" className="text-xs font-black text-brand hover:text-brand-dark">
                                Riwayat Laporan
                            </Link>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredReports.map((report) => {
                            const expanded = expandedReportId === report.id;
                            const busy = decidingId === report.id;

                            return (
                                <article key={report.id}>
                                    <div className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center">
                                        <div className="min-w-0 flex-1">
                                            <span className="font-mono text-xs font-bold text-slate-400">#{report.id}</span>
                                            <p className="mt-1 text-sm font-black leading-snug text-slate-800">{report.title}</p>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />{" "}
                                                    {report.locationDetail || "Lokasi belum diisi"}, {report.area || areaLabel}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 shrink-0 text-slate-400" /> {report.date}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setExpandedReportId(expanded ? null : report.id)}
                                                className="mt-2 inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-800"
                                                aria-expanded={expanded}
                                            >
                                                Detail &amp; bukti
                                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-180")} />
                                            </button>
                                        </div>

                                        <div className="grid shrink-0 gap-2 sm:w-52">
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => handleDecision(report, "accept_a")}
                                                className="w-full rounded-lg bg-red-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Terima Jalur A
                                            </button>
                                            <p className="-mt-1 text-center text-[10px] font-semibold text-slate-400">Darurat → Asisten AI</p>

                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => handleDecision(report, "accept_b")}
                                                className="w-full rounded-lg bg-brand px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Terima Jalur B
                                            </button>
                                            <p className="-mt-1 text-center text-[10px] font-semibold text-slate-400">Komunitas → Tabungan Aksi</p>

                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => openRejectDialog(report)}
                                                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Tolak Laporan
                                            </button>
                                        </div>
                                    </div>

                                    {expanded && (
                                        <div className="grid gap-4 border-t border-slate-100 bg-slate-50 p-5 sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Deskripsi laporan</p>
                                                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{report.details}</p>
                                                <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">Pelapor</p>
                                                <p className="mt-1 text-sm font-bold text-slate-700">{report.reporter || "Warga"}</p>
                                            </div>
                                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                {report.media?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {report.media.map((item, index) => (
                                                            <a
                                                                key={`${item.path}-${index}`}
                                                                href={item.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block"
                                                            >
                                                                <img
                                                                    src={item.url}
                                                                    alt={`Bukti laporan ${report.id}`}
                                                                    className="max-h-64 w-full bg-slate-100 object-contain"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex min-h-24 items-center justify-center gap-2 bg-slate-100 text-slate-400">
                                                        <Camera className="h-6 w-6" />
                                                        <span className="text-xs">Belum ada foto bukti</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2.5">
                                                    <span className="truncate text-xs font-bold text-slate-600">
                                                        {report.media?.length > 0 ? `${report.media.length} foto bukti` : "Bukti laporan"}
                                                    </span>
                                                    <span className="shrink-0 text-xs font-black text-brand">Bukti warga</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}

                        {filteredReports.length === 0 && (
                            <div className="py-16 text-center">
                                <CheckCircle2 className="mx-auto h-10 w-10 text-brand" />
                                <p className="mt-3 font-black text-slate-800">Semua laporan sudah diputuskan</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Laporan baru akan muncul di sini setelah dikirim warga.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {notice && (
                <div
                    className={cn(
                        "fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-xl",
                        notice.tone === "success" ? "border-brand-light" : "border-red-200"
                    )}
                    role="status"
                    aria-live="polite"
                >
                    <span className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        notice.tone === "success" ? "bg-brand-light text-brand" : "bg-red-50 text-red-600"
                    )}>
                        {notice.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">{notice.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{notice.message}</p>
                    </div>
                    <button type="button" onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700" aria-label="Tutup notifikasi">
                        ×
                    </button>
                </div>
            )}

            {rejectingReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="reject-report-title">
                        <h2 id="reject-report-title" className="text-lg font-black text-slate-900">
                            Tolak Laporan
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Berikan alasan penolakan untuk laporan{" "}
                            <span className="font-bold text-slate-700">#{rejectingReport.id}</span>. Alasan ini akan tampil pada laporan di Pantau Lapor zona publik.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            placeholder="Contoh: Bukti tidak dapat diverifikasi dan lokasi tidak ditemukan."
                            rows={4}
                            className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setRejectingReport(null);
                                    setRejectionReason("");
                                }}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={!rejectionReason.trim() || Boolean(decidingId)}
                                onClick={() => handleDecision(rejectingReport, "reject", rejectionReason)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {decidingId === rejectingReport.id ? "Menyimpan..." : "Konfirmasi Penolakan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
