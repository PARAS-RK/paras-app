"use client";

import { useState } from "react";
import {
  Camera, CheckCircle2, ChevronDown, ChevronRight, Clock,
  MapPin, ShieldAlert, UserRound, Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useReportContext } from "@/context/ReportContext";
import { useAksiState } from "@/lib/aksiStore";
import { USERS } from "@/lib/users";
import { useAdmin } from "@/context/AdminContext";
import { areaFull, areaLabel } from '@/lib/currentUser';

const reportTabs = [
  { id: 'all', label: 'Semua' },
  { id: 'emergency', label: 'Jalur A - Darurat' },
  { id: 'community', label: 'Jalur B - Komunitas' },
];

const reportLocations = {
  "LP-2024-089": "Depan RT 04 / RW 05",
  "LP-2024-088": "Permukiman RT 04 / RW 05",
  "LP-2024-087": "Area usaha RW 05",
  "LP-2024-086": "Jl. Melati RW 03",
  "LP-2024-085": "Lahan kosong RT 05 / RW 05",
  "LP-2024-082": "RT 02 / RT 04 / RT 05",
};

function MetricCard({ label, value, icon: Icon, tone, emergency }) {
  return (
    <article className={cn("rounded-2xl border bg-white p-5 shadow-sm", emergency ? "border-red-200" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-5 w-5" />
        </span>
        {emergency && (
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"
            aria-label="Memerlukan perhatian"
          />
        )}
      </div>
      <p className="mt-5 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </article>
  );
}

export default function AdminDashboard() {
  const [rejectingReport, setRejectingReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { areaLabel, areaFull } = useAdmin();
  const { reports, rerouteReport, reviewDashboardReport, rejectReport, } = useReportContext();
  const router = useRouter();
  const aksi = useAksiState();
  const [reportTab, setReportTab] = useState("all");
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [routingNotice, setRoutingNotice] = useState("");
  const scopedUsers = USERS.filter((user) => user.area === areaLabel);
  const scopedReports = reports.filter(
    (report) =>
        report.area.replace(/^Kel\.\s*/, '').trim() ===
        areaLabel.replace(/^Kel\.\s*/, '').trim()
);
console.log('AREA LABEL:', areaLabel);
console.log('REPORT AREA:', reports.map(r => r.area));
console.log('SCOPED REPORTS:', scopedReports);
  const activeReports = scopedReports.filter(
    (report) => report.status === "pending" || report.status === "in_progress"
  );
  const emergencyReports = scopedReports.filter((report) => report.handledBy === 'bpbd' && (report.status === 'pending' || report.status === 'in_progress'));
  const completedActions = aksi.aksi.filter((item) => item.location === areaLabel && item.status === "selesai").length;
  const activePkkMembers = scopedUsers.filter(
    (user) => user.status === "active" && (user.type === "pkk_member" || user.type === "pkk_chair")
  ).length;
  const activeCitizens = scopedUsers.filter(
    (user) => user.status === "active" && user.type === "general"
  ).length;

  const dashboardReports = scopedReports.map((report) => ({
    ...report,
    area: areaLabel,
    location: reportLocations[report.id] || areaLabel,
  }));

  console.log(
  'DASHBOARD DECISION:',
  dashboardReports.map(report => ({
    id: report.databaseId,
    decision: report.dashboardDecision,
    route: report.dashboardRoute,
  }))
);

  const filteredReports = dashboardReports
    .filter((report) => ! report.dashboardDecision)
    .filter((report) =>
        reportTab === 'all' ||
        (reportTab === 'emergency'
            ? report.handledBy === 'bpbd'
            : report.handledBy === 'community')
    );
    console.log('DASHBOARD REPORTS:', dashboardReports);
    console.log('REPORT TAB:', reportTab);
    console.log('FILTERED REPORTS:', filteredReports);

  function routeWithFeedback(message) {
    setRoutingNotice(message);
  }

  async function rerouteAndReview(reportId, route) {
    const result = await rerouteReport(reportId, route);

    if (!result.success) {
        setRoutingNotice(result.message || 'Gagal menyimpan perubahan rute.');
        return false;
    }

    routeWithFeedback(
        route === "emergency"
            ? "Laporan berhasil dipindahkan ke Jalur Darurat."
            : "Laporan berhasil dipindahkan ke Jalur Komunitas."
    );

    return true;
}

async function acceptReport(report) {
    const result = await reviewDashboardReport(report.id);

    if (!result.success) {
        setRoutingNotice(result.message || 'Gagal menerima laporan.');
        return;
    }

    setRoutingNotice('Laporan berhasil diterima.');
}

function rejectDashboardReport(report) {
    setRejectingReport(report);
    setRejectionReason('');
}

async function confirmRejectReport() {
    if (!rejectingReport || !rejectionReason.trim()) return;

    const result = await rejectReport(
        rejectingReport.id,
        rejectionReason.trim()
    );

    if (!result.success) {
        setRoutingNotice(result.message || 'Gagal menolak laporan.');
        return;
    }

    setRejectingReport(null);
    setRejectionReason('');
    setRoutingNotice('Laporan warga berhasil ditolak.');
}

async function overrideReport(report) {
    const currentRoute = report.handledBy === 'bpbd'
        ? 'emergency'
        : 'community';

    const destinationRoute = currentRoute === 'emergency'
        ? 'community'
        : 'emergency';

    await rerouteAndReview(report.id, destinationRoute);
}

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          <MapPin className="h-3.5 w-3.5 text-brand" /> {areaFull || areaLabel}
        </span>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Ringkasan metrik">
        <MetricCard label="Anggota PKK Aktif" value={activePkkMembers} icon={Users} tone="bg-brand-xlight text-brand" />
        <MetricCard label="Warga Aktif" value={activeCitizens} icon={UserRound} tone="bg-blue-50 text-blue-600" />
        <MetricCard label="Laporan Darurat / Aktif" value={emergencyReports.length} icon={ShieldAlert} tone="bg-red-50 text-red-600" emergency />
        <MetricCard label="Aksi Selesai" value={completedActions} icon={CheckCircle2} tone="bg-brand-xlight text-brand" />
      </section>

      <section>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black text-slate-900">Laporan Terbaru</h2>
              <Link href="/admin/ai-assistant" className="text-xs font-black text-brand hover:text-brand-dark">
                Lihat Semua
              </Link>
            </div>
            <div
              className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1"
              role="tablist"
              aria-label="Filter laporan"
            >
              {reportTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={reportTab === tab.id}
                  onClick={() => setReportTab(tab.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors",
                    reportTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => {
              const emergency = report.urgency >= 7;
              const expanded = expandedReportId === report.id;
              const urgencyTone = emergency
                ? "bg-red-50 text-red-700"
                : report.urgency >= 4
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600";

              return (
                <article key={report.id}>
                  <div className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center">
                    <div className={cn("flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl", urgencyTone)}>
                      <span className="text-lg font-black leading-none">{report.urgency}</span>
                      <span className="text-xs font-bold">/10</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-slate-400">#{report.id}</span>
                      <p className="mt-1 text-sm font-black leading-snug text-slate-800">{report.title}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" /> {report.location}, {report.area}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0 text-slate-400" /> {report.date}
                        </span>
                        <span>
                          <p className="flex items-center gap-1"> Detail Lokasi: {report.locationDetail || "Detail lokasi belum diisi"}</p>
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

                    <div className="grid shrink-0 gap-2 sm:w-44">
                      {report.dashboardDecision === 'accepted' ||
report.dashboardDecision === 'overridden' ? (
    <button
        type="button"
        onClick={() => router.push(
            report.handledBy === 'bpbd'
                ? '/admin/ai-assistant?queue=emergency'
                : '/admin/actions/savings'
        )}
        className="w-full rounded-lg bg-brand px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-dark"
    >
        {report.handledBy === 'bpbd'
            ? 'Lihat Laporan di Jalur A'
            : 'Lihat di Tabungan Aksi'}
    </button>
                      ) : (
                        <>
        <button
            type="button"
            onClick={() => acceptReport(report)}
            className="w-full rounded-lg bg-brand px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-dark"
        >
            Terima
        </button>

        <button
            type="button"
            onClick={() => rejectDashboardReport(report)}
            className="w-full rounded-lg bg-red-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700"
        >
            Tolak
        </button>

        <button
            type="button"
            onClick={() => overrideReport(report)}
            className="w-full rounded-lg bg-amber-500 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600"
        >
            Override ke {report.handledBy === 'bpbd' ? 'Jalur B' : 'Jalur A'}
        </button>
    </>
)}
</div>
</div>

                  {expanded && (
                    <div className="grid gap-4 border-t border-slate-100 bg-slate-50 p-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Deskripsi laporan</p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{report.details}</p>
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
            className="max-h-64 w-full object-contain bg-slate-100"
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
      {report.media?.length > 0
        ? `${report.media.length} foto bukti`
        : "Bukti laporan"}
    </span>
    <span className="shrink-0 text-xs font-black text-brand">
      Bukti warga
    </span>
  </div>
</div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {routingNotice && (
                <div className="fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-brand-light bg-white p-4 shadow-xl" role="status" aria-live="polite">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand"><CheckCircle2 className="h-4 w-4"/></span>
                    <div>
                        <p className="text-xs font-black text-slate-900">Routing berhasil</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{routingNotice}</p>
                    </div>
                </div>
            )}
            {rejectingReport && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black text-slate-900">
                Tolak Laporan
            </h2>

            <p className="mt-2 text-sm text-slate-500">
                Berikan alasan penolakan untuk laporan
                {' '}{rejectingReport.id}.
            </p>

            <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan..."
                rows={4}
                className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />

            <div className="mt-5 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setRejectingReport(null);
                        setRejectionReason('');
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                    Batal
                </button>

                <button
                    type="button"
                    disabled={!rejectionReason.trim()}
                    onClick={confirmRejectReport}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Konfirmasi Penolakan
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}