"use client";

import { useMemo, useState } from 'react';
import { AlertTriangle, Archive, Bot, CalendarDays, Camera, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDot, ClipboardCheck, Clock3, Copy, Download, FileText, Phone, LoaderCircle, MapPin, Pencil, Send, ShieldCheck, Siren, Sparkles, Upload, Users, XCircle, X, } from 'lucide-react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from '@/lib/utils';
import { useReportContext } from '@/context/ReportContext';
import { publishCommunityAksi, useAksiState } from '@/lib/aksiStore';
import { areaFull, areaLabel } from '@/lib/currentUser';
const statusConfig = {
    pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800', icon: Clock3 },
    in_progress: { label: 'Diproses', className: 'bg-blue-100 text-blue-800', icon: LoaderCircle },
    handled: { label: 'Selesai', className: 'bg-brand-light text-brand', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700', icon: XCircle },
};
const queueTabs = [
    {
        id: 'emergency',
        label: 'Laporan Darurat',
        description: 'Perlu diteruskan segera ke BPBD',
        icon: Siren,
    },
    {
        id: 'community',
        label: 'Aksi Komunitas',
        description: 'Dikumpulkan menjadi aksi warga',
        icon: Users,
    },
];

const exactLocations = {
    'LP-2024-089': `Depan RT 04 / RW 05, ${areaLabel}`,
    'LP-2024-088': `Permukiman RT 04 / RW 05, ${areaLabel}`,
    'LP-2024-087': `Area usaha RW 05, ${areaLabel}`,
    'LP-2024-086': `Jl. Melati RW 03, ${areaLabel}`,
    'LP-2024-085': `Lahan kosong RT 05 / RW 05, ${areaLabel}`,
    'LP-2024-082': `RT 02 / RT 04 / RT 05, ${areaLabel}`,
};
function incidentLocation(report) {
    return exactLocations[report.id] || report.location || areaLabel;
}
function urgencyLevel(report) {
    if (report.urgency >= 7)
        return { label: 'Tinggi/Darurat', className: 'bg-red-100 text-red-700', icon: Siren };
    if (report.urgency >= 4)
        return { label: 'Sedang', className: 'bg-orange-100 text-slate-900', icon: AlertTriangle };
    return { label: 'Rendah', className: 'bg-slate-100 text-slate-700', icon: CircleDot };
}
function bpbdTemplate(report) {
    return `Yth. BPBD Jakarta Selatan, mohon bantuan penanganan segera untuk wilayah ${areaLabel}.

Kejadian: ${report.title}
TKP: ${incidentLocation(report)}
Wilayah administratif: ${areaFull}
Waktu laporan: ${report.date}
Tingkat urgensi: ${urgencyLevel(report).label}

Situasi: ${report.details}

Mohon konfirmasi tindak lanjut. Terima kasih.`;
}
function downloadEvidenceImage(report) {
    const safeTitle = report.title.replace(/[<>&]/g, '');
    const safeLocation = incidentLocation(report).replace(/[<>&]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="whitesmoke"/><rect x="48" y="48" width="1104" height="579" rx="28" fill="white" stroke="lightgray" stroke-width="4"/><text x="96" y="150" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="darkslategray">BUKTI FOTO WARGA</text><text x="96" y="225" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="midnightblue">${safeTitle}</text><text x="96" y="290" font-family="Arial,sans-serif" font-size="26" fill="darkslategray">${safeLocation}</text><text x="96" y="540" font-family="Arial,sans-serif" font-size="22" fill="lightslategray">Pratinjau bukti laporan #${report.id}</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bukti-${report.id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
}
function EvidenceBox({ report, urgent = false }) {
    return (<div className="mt-6">
      <p className="flex items-center gap-1.5 text-xs font-black text-slate-800"><Camera className={cn('h-4 w-4', urgent ? 'text-red-600' : 'text-brand')}/> Bukti Foto Warga</p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
          <Camera className="h-10 w-10"/>
          <p className="mt-3 text-xs font-black">Pratinjau bukti laporan</p>
          <p className="mt-1 text-xs">#{report.id}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-3">
          <p className="truncate text-xs font-semibold text-slate-500">bukti-{report.id}.svg</p>
          <button type="button" onClick={() => downloadEvidenceImage(report)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"><Download className="h-3.5 w-3.5"/> Unduh Gambar</button>
        </div>
      </div>
    </div>);
}
function RejectionDialog({ open, title, onClose, onConfirm }) {
    const [reason, setReason] = useState('Laporan tidak valid atau bukti yang diberikan tidak dapat diverifikasi.');
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700"><XCircle className="h-5 w-5"/></span>
          <div>
            <h3 id="reject-dialog-title" className="text-base font-black text-slate-900">Tolak {title}?</h3>
            <p className="mt-1 text-xs text-slate-500">Alasan penolakan rekomendasi tidak akan mengubah status laporan warga.</p>
          </div>
        </div>
        <label className="mt-4 block text-xs font-black text-slate-700">Alasan Penolakan
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-1 w-full resize-none rounded-xl border border-red-200 bg-white p-3 text-sm leading-relaxed text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"/>
        </label>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Batal</button>
          <button type="button" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">Tolak Rekomendasi</button>
        </div>
      </div>
    </div>);
}
function StatusPill({ status }) {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (<span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', config.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden/> {config.label}
    </span>);
}
function MetricCard({ label, value, icon: Icon, tone }) {
    return (<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="h-5 w-5" aria-hidden/>
      </span>
      <span>
        <span className="block text-2xl font-black leading-none text-slate-900">{value}</span>
        <span className="mt-1 block text-xs font-semibold text-slate-500">{label}</span>
      </span>
    </div>);
}
function ReportSummary({ report, open, onToggle }) {
    const urgency = urgencyLevel(report);
    const UrgencyIcon = urgency.icon;
    return (<>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">#{report.id}</span>
        <StatusPill status={report.status}/>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', urgency.className)}>
          <UrgencyIcon className="h-3.5 w-3.5" aria-hidden/> {urgency.label}
        </span>
      </div>
      <h3 className="mt-3 text-base font-black text-slate-900">{report.title}</h3>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Lokasi kejadian (TKP)</p>
        <p className="mt-1 flex items-start gap-1.5 text-sm font-black text-slate-900">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden/> {incidentLocation(report)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" aria-hidden/>{report.date}</p>
      </div>
      <button type="button" onClick={onToggle} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark">
        {open ? <ChevronUp className="h-4 w-4" aria-hidden/> : <ChevronDown className="h-4 w-4" aria-hidden/>}
        {open ? 'Tutup detail' : 'Lihat rincian kejadian'}
      </button>
      {open && (<div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
          <p>{report.details}</p>
        </div>)}
    </>);
}
function EmergencyCard({ report, onApprove, onFinish, onSaveDraft }) {
    const [message, setMessage] = useState(
        report.emergencyDraft ?? bpbdTemplate(report)
    );
    const [hotline, setHotline] = useState(
        report.emergencyHotline ?? '112 — Jakarta Siaga'
    );
    const [copied, setCopied] = useState(false);
    const [proofFile, setProofFile] = useState(null);
    const [completionNotes, setCompletionNotes] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [draftOpen, setDraftOpen] = useState(report.status === 'pending');
    const [resolutionOpen, setResolutionOpen] = useState(false);
    const [editingDraft, setEditingDraft] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);

    const hasDraftChanges =
        message !== (report.emergencyDraft ?? bpbdTemplate(report)) ||
        hotline !== (report.emergencyHotline ?? '112 — Jakarta Siaga');

    function saveDraft() {
        onSaveDraft(message, hotline);
        setEditingDraft(false);
        setDraftSaved(true);
    }

    async function copyMessage() {
        await navigator.clipboard.writeText(`Hotline: ${hotline}\n\n${message}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    function markHandled() {
        onApprove();
        setDraftOpen(false);
        setResolutionOpen(true);
    }
    const urgency = urgencyLevel(report);
    const canFinish = Boolean(proofFile && completionNotes.trim());
    return (<>
      <article className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-6 py-3">
          <p className="flex items-center gap-2 text-xs font-black text-red-700"><Siren className="h-4 w-4"/> Jalur A · Laporan Darurat</p>
        </div>

        <div className="grid lg:grid-cols-2">
          <section className="border-b border-red-100 p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700"><Siren className="h-3.5 w-3.5"/> {urgency.label}</span>
              <StatusPill status={report.status}/>
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">{report.title}</h3>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <dt className="text-xs font-bold text-slate-400">Nomor laporan</dt>
                <dd className="mt-1 font-mono text-xs font-black text-slate-800">#{report.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-400">Pelapor</dt>
                <dd className="mt-1 text-xs font-black text-slate-800">{report.reporter}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-400">Wilayah sesi</dt>
                <dd className="mt-1 text-xs font-black text-slate-800">{areaLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-400">Waktu laporan</dt>
                <dd className="mt-1 text-xs font-black text-slate-800">{report.date}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lokasi kejadian</p>
              <p className="mt-1 flex items-start gap-1.5 text-sm font-black text-slate-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-600"/> {incidentLocation(report)}</p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button type="button" onClick={() => setDetailsOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50" aria-expanded={detailsOpen}>
                <span className="flex items-center gap-2 text-sm font-black text-slate-800"><FileText className="h-4 w-4 text-red-600"/> Detail Laporan &amp; Bukti Warga</span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', detailsOpen && 'rotate-180')}/>
              </button>
              {detailsOpen && (
                <div className="border-t border-slate-100 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Deskripsi kejadian</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{report.details}</p>
                  </div>
                  <EvidenceBox report={report} urgent/>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 bg-slate-50 p-4 sm:p-6">
            <div className="overflow-hidden rounded-xl border border-red-200 bg-white">
              <button type="button" onClick={() => setDraftOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={draftOpen}>
                <span className="flex items-center gap-2 text-sm font-black text-red-800"><Sparkles className="h-4 w-4"/> Draf Eskalasi AI</span>
                <span className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 text-xs font-bold text-red-700 sm:inline-flex"><Pencil className="h-3.5 w-3.5"/> Bisa diedit</span>
                  {draftOpen ? <ChevronUp className="h-4 w-4 text-slate-400"/> : <ChevronDown className="h-4 w-4 text-slate-400"/>}
                </span>
              </button>

              {draftOpen && (
                <div className="border-t border-red-100 p-4">
    <label className="block text-xs font-black text-slate-700">
        Hotline / Kontak Resmi
        <span className="relative mt-1 block">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-600"/>
            <input
                value={hotline}
                readOnly={!editingDraft}
                onChange={(event) => setHotline(event.target.value)}
                className={`w-full rounded-xl border border-red-200 py-2.5 pl-10 pr-3 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 ${
                    editingDraft ? 'bg-white' : 'bg-slate-50 cursor-default'
                }`}
            />
        </span>
    </label>

    <label className="mt-4 block text-xs font-black text-slate-700">
        Template Pesan Resmi
        <textarea
            value={message}
            readOnly={!editingDraft}
            onChange={(event) => setMessage(event.target.value)}
            rows={7}
            className={`mt-1 w-full resize-y rounded-xl border border-red-200 p-3 text-sm leading-relaxed text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 ${
                editingDraft ? 'bg-white' : 'bg-slate-50 cursor-default'
            }`}
        />
    </label>

                  <div className="mt-4 grid grid-cols-2 gap-2">
    <button
        type="button"
        onClick={copyMessage}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
    >
        {copied ? <ClipboardCheck className="h-4 w-4 text-brand"/> : <Copy className="h-4 w-4"/>}
        {copied ? 'Tersalin' : 'Salin Pesan'}
    </button>

    {editingDraft ? (
        <button
            type="button"
            disabled={!hasDraftChanges}
            onClick={saveDraft}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-xs font-black text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <Check className="h-4 w-4"/>
            Simpan Perubahan
        </button>
    ) : (
        <button
            type="button"
            onClick={() => {
                setEditingDraft(true);
                setDraftSaved(false);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
        >
            <Pencil className="h-4 w-4"/>
            Edit Draf
        </button>
    )}
</div>

{draftSaved && (
    <p className="mt-2 text-xs font-semibold text-green-700">
        Perubahan tersimpan.
    </p>
)}

<div className="mt-2">
    {report.status === 'pending' ? (
        <button
            type="button"
            onClick={markHandled}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white hover:bg-blue-700"
        >
            <Send className="h-4 w-4"/> Ditangani
        </button>
    ) : (
        <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-100 px-3 py-2.5 text-xs font-black text-blue-700"
        >
            <Check className="h-4 w-4"/>
            {report.status === 'handled' ? 'Selesai' : 'Ditangani'}
        </button>
    )}
</div>
                </div>
              )}
            </div>

            {(
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button type="button" onClick={() => setResolutionOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={resolutionOpen}>
                  <span className="flex items-center gap-2 text-sm font-black text-slate-900"><CheckCircle2 className="h-4 w-4 text-brand"/> Penyelesaian Laporan</span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-700">Wajib lengkap</span>
                    {resolutionOpen ? <ChevronUp className="h-4 w-4 text-slate-400"/> : <ChevronDown className="h-4 w-4 text-slate-400"/>}
                  </span>
                </button>

                {resolutionOpen && (
                  <div className="border-t border-slate-100 p-4">
                    <div className="grid gap-4">
                      <label className="block text-xs font-black text-slate-700">Bukti foto penyelesaian
                        <span className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 transition-colors hover:border-brand-light hover:bg-brand-xlight">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm"><Upload className="h-4 w-4"/></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-slate-700">{proofFile?.name || 'Pilih gambar bukti'}</span>
                            <span className="mt-0.5 block text-xs font-normal text-slate-400">JPG, PNG, atau WEBP</span>
                          </span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className="sr-only"/>
                        </span>
                      </label>
                      <label className="block text-xs font-black text-slate-700">Catatan penyelesaian
                        <textarea value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value)} rows={3} placeholder="Jelaskan tindakan yang telah dilakukan dan kondisi akhir lokasi." className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/10"/>
                      </label>
                    </div>
                    <button type="button" disabled={!canFinish} onClick={() => onFinish(completionNotes.trim(), { completionNotes: completionNotes.trim(), proofName: proofFile.name, resolutionPhoto: URL.createObjectURL(proofFile) })} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-3 text-xs font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"><Check className="h-4 w-4"/> Tandai Selesai </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </article>

    </>);
}

function regionalCluster(report) {
    return areaLabel;
}
function categoryCluster(report) {
    return report.aiCategory.split('/')[0].trim();
}
function clusterKey(report) {
    return `${regionalCluster(report).toLowerCase()}|${categoryCluster(report).toLowerCase()}`;
}
function CommunityCard({ reports, onApprove, onReject, overridden, recordTimelineActivity, startCommunityHandling }) {
    const report = reports[0];
    const aksiState = useAksiState();
    const sourceId = reports.map((item) => item.id).join('-');
    const generatedId = `admin-${sourceId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const target = 10;
    const points = overridden ? target : Math.min(target, reports.reduce((sum, item) => sum + item.urgency, 0));
    const initialRecommendation = report.aiRecommendation.replace(/tantangan/gi, 'aksi').replace(/challenge/gi, 'aksi');
    const [draft, setDraft] = useState({
        name: report.suggestedActionName || `${report.title}`,
        description: initialRecommendation,
        steps: 'Koordinasikan warga dan petakan titik saluran yang tersumbat.\nSiapkan alat kebersihan, bor biopori, dan perlengkapan keselamatan.\nBersihkan saluran lalu buat lubang biopori pada titik yang disepakati.\nDokumentasikan hasil dan laporkan kepada Ketua PKK.',
        participantTarget: '40',
        duration: '2–3 jam',
        registrationRange: '3–7 November 2026',
        implementationRange: '8 November 2026',
    });
    const [publishedId, setPublishedId] = useState(() => aksiState.aksi.some((aksi) => aksi.id === generatedId) ? generatedId : null);
    const [editing, setEditing] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [draftOpen, setDraftOpen] = useState(false);

// State pop-up rekomendasi alternatif
    const [regenerationOpen, setRegenerationOpen] = useState(false);
    const [regenerationGuidance, setRegenerationGuidance] = useState('');
    const [generating, setGenerating] = useState(false);
    const [alternativeIndex, setAlternativeIndex] = useState(0);
    const [recommendationHistory, setRecommendationHistory] = useState([]);
    const publishedAksi = aksiState.aksi.find((aksi) => aksi.id === publishedId);
    const fieldsDisabled = Boolean(publishedId) || !editing;
    function updateDraft(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
    }
 function generateAlternative() {
    if (generating || publishedId) return;

    setGenerating(true);

    const isWaste = /sampah|polusi/i.test(report.aiCategory);

    const alternatives = isWaste
        ? [
            {
                name: `Gerakan Lingkungan Bersih: ${report.title}`,
                description: `Program aksi komunitas untuk menangani ${report.title.toLowerCase()} melalui pemetaan titik permasalahan, edukasi warga, dan kegiatan kebersihan bersama.`,
                steps: 'Petakan lokasi permasalahan dan identifikasi sumber pencemaran.\nKoordinasikan pembagian tugas dan perlengkapan dengan warga.\nLaksanakan kegiatan pembersihan dan edukasi pengelolaan lingkungan.\nDokumentasikan hasil kegiatan dan evaluasi kondisi lingkungan.',
                participantTarget: '40',
                duration: '2–3 jam',
                registrationRange: '10–12 November 2026',
                implementationRange: '14 November 2026',
            },
            {
                name: `Edukasi dan Pengelolaan Lingkungan: ${report.title}`,
                description: `Aksi kolaboratif warga untuk mengurangi permasalahan ${report.title.toLowerCase()} melalui edukasi, pengelolaan sampah, dan pemantauan lingkungan secara berkala.`,
                steps: 'Identifikasi kebiasaan dan sumber permasalahan di lingkungan.\nAdakan sosialisasi kepada warga mengenai pengelolaan lingkungan.\nBentuk pembagian tugas pemantauan dan pengelolaan sampah.\nEvaluasi perubahan kondisi lingkungan bersama warga.',
                participantTarget: '30',
                duration: '1–2 jam',
                registrationRange: '11–13 November 2026',
                implementationRange: '15 November 2026',
            },
        ]
        : [
            {
                name: `Gerakan Pencegahan Lingkungan: ${report.title}`,
                description: `Aksi bersama warga untuk menangani ${report.title.toLowerCase()} melalui pemetaan lokasi, perbaikan lingkungan, dan langkah pencegahan agar permasalahan tidak berulang.`,
                steps: 'Petakan titik permasalahan dan tentukan prioritas penanganan.\nKoordinasikan kebutuhan alat dan pembagian tugas warga.\nLaksanakan kegiatan penanganan sesuai kondisi lokasi.\nDokumentasikan hasil dan susun langkah pencegahan.',
                participantTarget: '40',
                duration: '2–3 jam',
                registrationRange: '10–12 November 2026',
                implementationRange: '14 November 2026',
            },
            {
                name: `Aksi Gotong Royong Warga: ${report.title}`,
                description: `Kegiatan gotong royong untuk menangani ${report.title.toLowerCase()} dengan melibatkan warga sekitar melalui koordinasi, pembagian tugas, dan pemantauan hasil kegiatan.`,
                steps: 'Koordinasikan warga dan tentukan lokasi kegiatan.\nIdentifikasi kebutuhan perlengkapan dan tenaga.\nLaksanakan gotong royong sesuai kebutuhan permasalahan.\nEvaluasi hasil kegiatan dan tentukan tindak lanjut.',
                participantTarget: '25',
                duration: '1–2 jam',
                registrationRange: '11–13 November 2026',
                implementationRange: '15 November 2026',
            },
        ];

    const alternative = alternatives[alternativeIndex % alternatives.length];

    setRecommendationHistory((history) => [
      ...history,
      {
          ...draft,
          version: history.length + 1,
          savedAt: new
    Date().toISOString(),
      },
    ]);

    setDraft((current) => ({
        ...current,
        name: alternative.name,
        description: alternative.description,
        steps: alternative.steps,
        participantTarget: alternative.participantTarget,
        duration: alternative.duration,
        registrationRange: alternative.registrationRange,
        implementationRange: alternative.implementationRange,
    }));

    setAlternativeIndex((index) => index + 1);
    setEditing(false);
    setDraftOpen(true);
    setRegenerationOpen(false);
    setRegenerationGuidance('');
    setGenerating(false);
}
    function publishDraft() {
    if (report.mockDraft) {
        setPublishedId('simulation');
        return;
    }

    onApprove();

    const id = publishCommunityAksi({  
        sourceId,
        sourceReportIds: reports.map((item) => item.id),
        title: draft.name,
        description: draft.description,
        steps: draft.steps.split('\n').map((step) => step.trim()).filter(Boolean),
        participantTarget: Math.max(1, Number(draft.participantTarget) || 1),
        duration: draft.duration,
        registrationRange: draft.registrationRange,
        implementationRange: draft.implementationRange,
        location: incidentLocation(report),
        reportCount: reports.length,
        category: categoryCluster(report),
    });

    reports.forEach((item) => {
    recordTimelineActivity(
        item.id,
        'handling',
        'Aksi komunitas diterbitkan',
        `Laporan tergabung dalam aksi "${draft.name}" (ID: ${id}).`
    );

    startCommunityHandling(item.id, id, draft.name);
});

setPublishedId(id);
}
    const fieldClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-slate-500';

    const statusBadge = publishedId
        ? { label: 'Tayang', className: 'bg-brand-light text-brand-dark' }
        : editing
            ? { label: 'Sedang diedit', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' }
            : { label: 'Siap diterbitkan', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' };
    function toggleEditing() {
        setEditing((value) => !value);
        setDraftOpen(true);
    }

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-brand-dark"><Users className="h-3.5 w-3.5"/> Jalur B · Aksi Komunitas</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">Ambang terpenuhi</span>
                        {overridden && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">Override Jalur A</span>}
                    </div>
                    <h3 className="mt-2 text-base font-black text-slate-900">{draft.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MapPin className="h-3.5 w-3.5 text-brand"/> {incidentLocation(report)} · {categoryCluster(report)}</p>
                </div>
                <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', statusBadge.className)}>{publishedId ? <CheckCircle2 className="h-3.5 w-3.5"/> : <CircleDot className="h-3.5 w-3.5"/>} {statusBadge.label}</span>
            </header>

            <div className="grid items-start gap-4 p-5 lg:grid-cols-2">
                <section className="overflow-hidden rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setReportsOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50" aria-expanded={reportsOpen}>
                        <span className="flex items-center gap-2 text-sm font-black text-slate-800"><FileText className="h-4 w-4 text-brand"/> Daftar Laporan Pembentuk ({points}/{target} Poin)</span>
                        <span className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{reports.length} laporan</span>
                            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', reportsOpen && 'rotate-180')}/>
                        </span>
                    </button>
                    {reportsOpen && (
                        <ul className="divide-y divide-slate-100 border-t border-slate-100">
                            {reports.map((item) => (
                                <li key={item.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <span className="font-mono text-xs font-bold text-slate-400">#{item.id}</span>
                                            <p className="mt-0.5 text-sm font-black text-slate-800">{item.title}</p>
                                            <p className="mt-1 text-xs text-slate-500">{item.reporter} · {item.date}</p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-brand-xlight px-2 py-0.5 font-mono text-xs font-black text-brand-dark">+{item.urgency} poin</span>
                                    </div>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.details}</p>
                                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                                        <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"><Camera className="h-5 w-5"/></span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-xs font-bold text-slate-700">Bukti Foto Warga</span>
                                            <span className="block truncate text-xs text-slate-400">bukti-{item.id}.svg</span>
                                        </span>
                                        <button type="button" onClick={() => downloadEvidenceImage(item)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"><Download className="h-3.5 w-3.5"/> Unduh</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setDraftOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50" aria-expanded={draftOpen}>
                        <span className="flex items-center gap-2 text-sm font-black text-slate-800"><Bot className="h-4 w-4 text-brand"/> Draf Rencana Aksi AI — {statusBadge.label}</span>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', draftOpen && 'rotate-180')}/>
                    </button>
                    {!draftOpen && (
                        <dl className="grid grid-cols-3 gap-2 border-t border-slate-100 px-4 py-3 text-xs">
                            <div><dt className="text-slate-400">Peserta</dt><dd className="mt-0.5 font-bold text-slate-800">{draft.participantTarget} orang</dd></div>
                            <div><dt className="text-slate-400">Pendaftaran</dt><dd className="mt-0.5 font-bold text-slate-800">{draft.registrationRange}</dd></div>
                            <div><dt className="text-slate-400">Pelaksanaan</dt><dd className="mt-0.5 font-bold text-slate-800">{draft.implementationRange}</dd></div>
                        </dl>
                    )}
                    {draftOpen && (
                        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                            <label className="text-xs font-bold text-slate-700 sm:col-span-2">Nama Kegiatan
                                <input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} disabled={fieldsDisabled} className={fieldClass}/>
                            </label>
                            <label className="text-xs font-bold text-slate-700 sm:col-span-2">Deskripsi
                                <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} disabled={fieldsDisabled} rows={3} className={cn(fieldClass, 'resize-none')}/>
                            </label>
                            <label className="text-xs font-bold text-slate-700 sm:col-span-2">Langkah-Langkah Aksi
                                <textarea value={draft.steps} onChange={(event) => updateDraft('steps', event.target.value)} disabled={fieldsDisabled} rows={5} className={cn(fieldClass, 'resize-none')}/>
                            </label>
                            <label className="text-xs font-bold text-slate-700">Target Partisipan
                                <input type="number" min="1" value={draft.participantTarget} onChange={(event) => updateDraft('participantTarget', event.target.value)} disabled={fieldsDisabled} className={fieldClass}/>
                            </label>
                            <label className="text-xs font-bold text-slate-700">Durasi
                                <input value={draft.duration} onChange={(event) => updateDraft('duration', event.target.value)} disabled={fieldsDisabled} className={fieldClass}/>
                            </label>
                            <label className="text-xs font-bold text-slate-700">Jadwal Pendaftaran
                                <input value={draft.registrationRange} onChange={(event) => updateDraft('registrationRange', event.target.value)} disabled={fieldsDisabled} className={fieldClass}/>
                            </label>
                            <label className="text-xs font-bold text-slate-700">Jadwal Pelaksanaan
                                <input value={draft.implementationRange} onChange={(event) => updateDraft('implementationRange', event.target.value)} disabled={fieldsDisabled} className={fieldClass}/>
                            </label>
                        </div>
                    )}
                </section>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="text-xs text-slate-500">{publishedId ? `${publishedAksi?.participants ?? 0}/${publishedAksi?.quota ?? draft.participantTarget} peserta terdaftar` : 'Tinjau laporan dan draf sebelum menerbitkan aksi.'}</p>
                {!publishedId ? (
                    <div className="flex flex-wrap justify-end gap-2">
    <button
        type="button"
        onClick={() => setRegenerationOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-white px-3.5 py-2 text-xs font-black text-brand-dark hover:bg-brand-xlight"
    >
        <Sparkles className="h-3.5 w-3.5" />
        Buat Rekomendasi Lain
    </button>

    <button
        type="button"
        onClick={toggleEditing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
    >
        <Pencil className="h-3.5 w-3.5" />
        {editing ? 'Simpan Draf' : 'Edit Draf'}
    </button>

    <button
        type="button"
        onClick={publishDraft}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-black text-white hover:bg-brand-dark"
    >
        <Send className="h-3.5 w-3.5" />
        Publikasikan Aksi
    </button>
</div>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-brand-dark"><CheckCircle2 className="h-4 w-4"/> Aksi telah diterbitkan</span>
                )}
            </footer>
            {regenerationOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="regeneration-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                    <h3
                        id="regeneration-title"
                        className="text-base font-black text-slate-900"
                    >
                        Buat Rekomendasi Lain
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Berikan arahan tambahan jika diperlukan.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setRegenerationOpen(false);
                        setRegenerationGuidance('');
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Tutup pop-up"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    generateAlternative();
                }}
                className="space-y-4 p-5"
            >
                <div>
                    <label
                        htmlFor={`guidance-${generatedId}`}
                        className="text-sm font-bold text-slate-800"
                    >
                        Arahan atau Masukan Ketua PKK
                        <span className="ml-2 text-xs font-medium text-slate-400">
                            (Opsional)
                        </span>
                    </label>

                    <textarea
                        id={`guidance-${generatedId}`}
                        value={regenerationGuidance}
                        onChange={(event) =>
                            setRegenerationGuidance(event.target.value)
                        }
                        rows={4}
                        placeholder="Contoh: Sesuaikan kegiatan agar lebih sederhana, hemat biaya, dan melibatkan warga sekitar."
                        className={cn(fieldClass, 'mt-2 resize-none')}
                        disabled={generating}
                    />

                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Arahan akan disimpan sebagai masukan untuk integrasi AI pada tahap berikutnya.
                        Saat ini rekomendasi masih menggunakan template simulasi.
                    </p>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            setRegenerationOpen(false);
                            setRegenerationGuidance('');
                        }}
                        disabled={generating}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        disabled={generating}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-xs font-black text-white hover:bg-brand-dark disabled:opacity-60"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        {generating
                            ? 'Membuat Rekomendasi...'
                            : 'Buat Rekomendasi'}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
        </article>
    );
}

export default function AIAssistant() {
    const {
    reports,
    approveReport,
    saveEmergencyDraft,
    finalizeReport,
    acceptRecommendation,
    rejectRecommendation,
    recordTimelineActivity,
    startCommunityHandling,
} = useReportContext();

const actionState = useAksiState();
const searchParams = useSearchParams();

const [queue, setQueue] = useState(
    searchParams.get('queue') === 'emergency' ? 'emergency' : 'community'
);

// Hanya laporan yang sudah diterima/di-override di Dashboard
// dan belum memiliki keputusan rekomendasi AI.
const eligibleReports = reports.filter((report) =>
    ['accepted', 'overridden'].includes(report.dashboardDecision) &&
    report.status !== 'rejected' &&
    report.status !== 'handled' &&
    !report.recommendationDecision
);

// Jalur A: rute aktual BPBD
const emergencyReports = eligibleReports.filter(
    (report) => report.handledBy === 'bpbd'
);

// Jalur B: rute aktual komunitas
const communityReports = eligibleReports.filter(
    (report) => report.handledBy === 'community'
);

const allCommunityClusters = Array.from(
    communityReports.reduce((clusters, report) => {
        const key = report.dashboardDecision ===
        'overridden' &&
             report.dashboardRoute ===
        'community' &&
             report.overrideFrom === 'bpbd'
            ? `override-${report.id}`
            : clusterKey(report);

        const current = clusters.get(key) || [];
        current.push(report);
        clusters.set(key, current);

        return clusters;
    }, new Map()).values()
);

const maturedClusters = allCommunityClusters.filter((cluster) => {
    const isEmergencyOverride = cluster.some(
        (report) =>
            report.dashboardDecision === 'overridden' &&
            report.dashboardRoute === 'community' &&
            report.overrideFrom === 'bpbd'
    );

    if (isEmergencyOverride) return true;

    const totalPoints = cluster.reduce(
        (sum, report) => sum + (Number(report.urgency) || 0),
        0
    );

    const uniqueReporters = new Set(
        cluster
            .map((report) => report.reporter?.trim().toLowerCase())
            .filter(Boolean)
    ).size;

    return totalPoints >= 10 && uniqueReporters >= 3;
});

const readyClusters = maturedClusters;
    
    const metrics = [
        { label: 'Total Dianalisis', value: reports.length, icon: Bot, tone: 'bg-slate-100 text-slate-700' },
        { label: 'Siap Diterbitkan', value: readyClusters.filter((cluster) => !actionState.aksi.some((aksi) => aksi.id === `admin-${cluster.map((item) => item.id).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)).length, icon: Sparkles, tone: 'bg-amber-100 text-amber-800' },
        { label: 'Aksi Diterbitkan', value: actionState.aksi.filter((aksi) => aksi.id.startsWith('admin-')).length, icon: CheckCircle2, tone: 'bg-brand-light text-brand' },
        { label: 'Jalur Darurat', value: emergencyReports.length, icon: Siren, tone: 'bg-red-100 text-red-700' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h1 className="text-2xl font-black text-slate-900">Asisten AI</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-light bg-brand-xlight px-3 py-2.5 text-xs font-black text-brand-dark"><MapPin className="h-3.5 w-3.5"/> {areaLabel}</span>
                    <Link href="/admin/ai-assistant/archive" className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50">
                        <Archive className="h-4 w-4"/> Arsip Penanganan Laporan
                    </Link>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Status pemrosesan AI">
                {metrics.map((metric) => <MetricCard key={metric.label} {...metric}/>)}
            </section>

            <div className="grid rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:grid-cols-2" role="tablist" aria-label="Jenis antrean">
                {queueTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = queue === tab.id;
                    const count = tab.id === 'emergency' ? emergencyReports.length : readyClusters.length;
                    return (
                        <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => setQueue(tab.id)} className={cn('flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all', active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                            <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', active ? (tab.id === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-brand-light text-brand') : 'bg-slate-200 text-slate-500')}><Icon className="h-5 w-5"/></span>
                            <span className="flex-1 text-sm font-black">{tab.label}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{count}</span>
                        </button>
                    );
                })}
            </div>

            <section>
                <h2 className="mb-4 text-lg font-black text-slate-900">{queue === 'emergency' ? 'Laporan Darurat' : 'Aksi Komunitas'}</h2>
                <div className="space-y-4">
    {queue === 'emergency' && emergencyReports.length > 0 &&
        emergencyReports.map((report) => (
            <EmergencyCard
                key={report.id}
                report={report}
                onApprove={() => approveReport(report.id)}
                onFinish={(outcomeNotes, resolution) =>
                    finalizeReport(report.id, outcomeNotes, resolution)
                }
                onSaveDraft={(message, hotline) => saveEmergencyDraft(report.id, message, hotline)}
            />
        ))
    }

    {queue === 'community' && readyClusters.length > 0 &&
        readyClusters.map((cluster) => (
            <CommunityCard
                key={cluster[0].id}
                reports={cluster}
                onApprove={() =>
                    cluster.forEach((item) => acceptRecommendation(item.id))
                }
                onReject={(reason) =>
                    cluster.forEach((item) => rejectRecommendation(item.id, reason))
                }
                recordTimelineActivity={recordTimelineActivity}
                startCommunityHandling={startCommunityHandling}
            />
        ))
    }
</div>
            </section>

        </div>
    );
}