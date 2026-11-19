"use client";

import { useRef, useState, useEffect } from 'react';
import { Archive, Bot, CalendarDays, Camera, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDot, ClipboardCheck, Clock3, Copy, Download, FileText, Phone, LoaderCircle, MapPin, Pencil, Send, ShieldCheck, Siren, Sparkles, Upload, Users, XCircle, } from 'lucide-react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from '@/lib/utils';
import { useReportContext } from '@/context/ReportContext';
import { useAdminAksi } from '@/lib/adminAksi';
import { useAdmin } from '@/context/AdminContext';
const statusConfig = {
    pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800', icon: Clock3 },
    in_review: { label: 'Menunggu Penanganan', className: 'bg-amber-100 text-amber-800', icon: Clock3 },
    in_progress: { label: 'Sedang Ditangani', className: 'bg-blue-100 text-blue-800', icon: LoaderCircle },
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

function incidentLocation(report, areaLabel) {
    return report.locationDetail || report.regionLabel || 'Lokasi belum tersedia';
}

function bpbdTemplate(report, areaLabel, areaFull) {
    return `Yth. BPBD,

Kejadian: ${report.title}
Pelapor: ${report.reporter || 'Tidak diketahui'}
TKP: ${incidentLocation(report, areaLabel)}
Wilayah administratif: ${areaFull}
Waktu laporan: ${report.date}

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
    const [selectedImage, setSelectedImage] = useState(null);

    const photos = (report.media || []).filter(
        (file) => file.file_type === 'image' || file.url
    );

    const downloadPhoto = async (photo, index) => {
    try {
        const response = await fetch(photo.url);
        if (!response.ok) throw new Error('Gagal mengambil foto');

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `bukti-${report.id}-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        console.error('Gagal mengunduh foto:', error);
        alert('Foto gagal diunduh. Silakan coba lagi.');
    }
};

    return (
        <div className="mt-6">
            <p className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Camera className={cn(
                    'h-4 w-4',
                    urgent ? 'text-red-600' : 'text-brand'
                )} />
                Bukti Foto Warga
            </p>

            {photos.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                    {photos.map((photo, index) => (
                        <div
    key={photo.path || photo.url || index}
    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
>
    <button
        type="button"
        onClick={() => setSelectedImage(photo.url)}
        className="block w-full text-left"
    >
        <img
            src={photo.url}
            alt={`Bukti laporan ${report.id} ${index + 1}`}
            className="aspect-video w-full object-cover"
        />
        <p className="truncate p-2 text-xs font-semibold text-slate-500">
            Foto {index + 1}
        </p>
    </button>

    <div className="border-t border-slate-200 p-2">
        <button
    type="button"
    onClick={() => downloadPhoto(photo, index)}
    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white"
>
    <Download className="h-3.5 w-3.5" />
    Unduh Gambar
</button>
    </div>
</div>
                    ))}
                    </div>
            ) : (
                <div className="mt-3 flex aspect-video flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                    <Camera className="h-10 w-10" />
                    <p className="mt-3 text-xs font-black">
                        Tidak ada foto terlampir
                    </p>
                    <p className="mt-1 text-xs">#{report.id}</p>
                </div>
            )}

            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
                    >
                        Tutup
                    </button>
                    <img
                        src={selectedImage}
                        alt="Foto bukti laporan"
                        className="max-h-[85vh] max-w-full rounded-xl object-contain"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
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
    const normalizedStatus = {
        submitted: 'pending',
        in_review: 'in_review',
        in_progress: 'in_progress',
        resolved: 'handled',
    }[status] || status;

    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
            config.className
        )}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {config.label}
        </span>
    );
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
    return (<>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">#{report.id}</span>
        <StatusPill status={report.status}/>
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
    const admin = useAdmin();
    const [message, setMessage] = useState(
        report.emergencyDraft ?? bpbdTemplate(report, admin.areaLabel, admin.areaFull)
    );
    const [hotline, setHotline] = useState(
        report.emergencyHotline ?? ''
    );
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(true);

    useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
        setContactsLoading(true);

        try {
            const response = await fetch('/api/admin/emergency-contacts');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Gagal mengambil kontak darurat');
            }

            if (cancelled) return;

            const list = Array.isArray(result.contacts) ? result.contacts : [];
            setContacts(list);

            if (!report.emergencyHotline) {
                const bpbd = list.find((item) => item.agency_type === 'bpbd');
                setHotline(bpbd?.phone_number ?? list[0]?.phone_number ?? '');
            }
        } catch (error) {
            console.error('Gagal memuat kontak darurat:', error);
            if (!cancelled) setContacts([]);
        } finally {
            if (!cancelled) setContactsLoading(false);
        }
    }

    loadContacts();

    return () => {
        cancelled = true;
    };
}, [report.id, report.emergencyHotline]);

    const [copied, setCopied] = useState(false);
    const [proofFile, setProofFile] = useState(null);
    const [completionNotes, setCompletionNotes] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [draftOpen, setDraftOpen] = useState(report.status === 'in_review');
    const [resolutionOpen, setResolutionOpen] = useState(false);
    const [handling, setHandling] = useState(false);
    const [editingDraft, setEditingDraft] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);

    const hasDraftChanges =
        message !== (report.emergencyDraft ?? bpbdTemplate(report, admin.areaLabel, admin.areaFull)) ||
        hotline !== (report.emergencyHotline ?? '');

    async function saveDraft() {
    const saved = await onSaveDraft(message, hotline);

    if (!saved) {
        setDraftSaved(false);
        return;
    }

    setEditingDraft(false);
    setDraftSaved(true);
}

    async function copyMessage() {
        await navigator.clipboard.writeText(`Hotline: ${hotline}\n\n${message}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    async function markHandled() {
        if (handling) return;

        setHandling(true);
        const approved = await onApprove();
        setHandling(false);

        if (!approved) {
            alert('Gagal memulai penanganan. Silakan coba lagi.');
            return;
        }

        setDraftOpen(false);
        setResolutionOpen(true);
    }
    const canAccessResolution = report.status === 'in_progress';
    const canFinish = canAccessResolution && Boolean(proofFile && completionNotes.trim());

    return (<>
      <article className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-6 py-3">
          <p className="flex items-center gap-2 text-xs font-black text-red-700"><Siren className="h-4 w-4"/> Jalur A · Laporan Darurat</p>
        </div>

        <div className="grid lg:grid-cols-2">
          <section className="border-b border-red-100 p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-2">
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
                <dd className="mt-1 text-xs font-black text-slate-800">{admin.areaLabel}</dd>
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
            <select
                value={hotline}
                disabled={!editingDraft}
                onChange={(event) => setHotline(event.target.value)}
                className={`w-full appearance-none rounded-xl border border-red-200 py-2.5 pl-10 pr-3 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 ${
                    editingDraft ? 'bg-white' : 'bg-slate-50 cursor-default'
                }`}
            >
                <option value="">
                    {contactsLoading ? 'Memuat kontak...' : 'Pilih hotline / kontak resmi'}
                </option>
                {hotline && !contacts.some((item) => item.phone_number === hotline) && (
                    <option value={hotline}>Kontak tersimpan: {hotline}</option>
                )}
                {contacts.map((contact) => (
                    <option key={contact.id ?? contact.phone_number} value={contact.phone_number}>
                        {contact.agency_name} · {contact.phone_number}
                    </option>
                ))}
            </select>
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
    {report.status === 'in_review' ? (
        <button
            type="button"
            disabled={handling}
            onClick={markHandled}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {handling ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
            {handling ? 'Memproses...' : 'Ditangani'}
        </button>
    ) : (
        <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-100 px-3 py-2.5 text-xs font-black text-blue-700"
        >
            <Check className="h-4 w-4"/>
            {report.status === 'resolved' || report.status === 'handled' ? 'Selesai' : 'Ditangani'}
        </button>
    )}
</div>
                </div>
              )}
            </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
  <button
    type="button"
    disabled={!canAccessResolution}
    onClick={() => setResolutionOpen((open) => !open)}
    className={cn(
      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left',
      canAccessResolution
        ? 'hover:bg-slate-50'
        : 'cursor-not-allowed opacity-60'
    )}
    aria-expanded={canAccessResolution && resolutionOpen}
  >
    <span className="flex items-center gap-2 text-sm font-black text-slate-900">
      <CheckCircle2 className="h-4 w-4 text-brand" />
      Penyelesaian Laporan
    </span>
    <span className="flex items-center gap-2">
      <span className={cn(
        'rounded-full px-2 py-1 text-xs font-black',
        canAccessResolution
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-500'
      )}>
        {canAccessResolution ? 'Wajib lengkap' : 'Menunggu penanganan'}
      </span>
      {canAccessResolution && (
        resolutionOpen
          ? <ChevronUp className="h-4 w-4 text-slate-400" />
          : <ChevronDown className="h-4 w-4 text-slate-400" />
      )}
    </span>
  </button>

  {!canAccessResolution && (
    <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      Form penyelesaian akan tersedia setelah draft eskalasi ditangani.
    </p>
  )}

  {canAccessResolution && resolutionOpen && (
    <div className="border-t border-slate-100 p-4">
      <div className="grid gap-4">
        <label className="block text-xs font-black text-slate-700">
          Bukti foto penyelesaian
          <span className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
              <Upload className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-slate-700">
                {proofFile?.name || 'Pilih gambar bukti'}
              </span>
              <span className="mt-0.5 block text-xs font-normal text-slate-400">
                JPG, PNG, atau WEBP
              </span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setProofFile(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </span>
        </label>

        <label className="block text-xs font-black text-slate-700">
          Catatan penyelesaian
          <textarea
            value={completionNotes}
            onChange={(event) => setCompletionNotes(event.target.value)}
            rows={3}
            placeholder="Jelaskan tindakan yang telah dilakukan dan kondisi akhir lokasi."
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={!canFinish}
        onClick={() => onFinish(completionNotes.trim(), {
          completionNotes: completionNotes.trim(),
          proofName: proofFile?.name || null,
          resolutionPhoto: proofFile
            ? URL.createObjectURL(proofFile)
            : null,
          proofFile: proofFile || null,
        })}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-3 text-xs font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Check className="h-4 w-4" />
        Tandai Selesai
      </button>
    </div>
  )}
</div>
          </section>
        </div>
      </article>

    </>);
}

function regionalCluster(report) {
    return report.area || report.regionLabel || 'Wilayah tidak diketahui';
}
function categoryCluster(report) {
    return String(report.aiCategory || report.title || 'Umum')
        .split('/')[0]
        .trim() || 'Umum';
}
function clusterKey(report) {
    return `${regionalCluster(report).toLowerCase()}|${categoryCluster(report).toLowerCase()}`;
}
function CommunityCard({ reports, recordTimelineActivity, startCommunityHandling, communityDrafts, communityDraftsLoaded, saveCommunityDraft, publishCommunityAction }) {
    const report = reports[0];
    const { aksi } = useAdminAksi();
    const sourceId = reports.map((item) => item.id).join('-');
    const reportIds = reports.map((item) => String(item.databaseId || item.id));
    const publishedAction = aksi.find((action) =>
        (action.sourceReportIds || []).some((id) => reportIds.includes(String(id)))
    );
    const savedDraft = communityDrafts?.[sourceId];
    const clusterRecommendation = reports
        .map((item) => item.aiRecommendation)
        .filter(Boolean)
        .join(' ');
    const initialRecommendation = String(
        clusterRecommendation ||
        `Aksi komunitas untuk menangani ${reports.map((item) => item.title).join(', ')} di ${incidentLocation(report)}.`
    ).replace(/tantangan/gi, 'aksi').replace(/challenge/gi, 'aksi');
    const defaultDraft = {
        name: report.suggestedActionName || `${report.title}`,
        description: initialRecommendation,
        steps: '',
        participantTarget: '40',
        duration: '2–3 jam',
        registrationRange: '',
        implementationRange: '',
        location: incidentLocation(report),
        category: categoryCluster(report),
    };
    const [draft, setDraft] = useState(() => savedDraft
        ? { ...defaultDraft, ...savedDraft }
        : defaultDraft
    );
    const [publishedId, setPublishedId] = useState(() => publishedAction ? String(publishedAction.id) : null);
    const [editing, setEditing] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [draftOpen, setDraftOpen] = useState(false);
    const autoGeneratedRef = useRef(false);
    const publishedAksi = aksi.find((action) => String(action.id) === String(publishedId));
    const fieldsDisabled = Boolean(publishedId) || !editing;
    function updateDraft(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
    }

    useEffect(() => {
        if (publishedAction && !publishedId) setPublishedId(String(publishedAction.id));
    }, [publishedAction, publishedId]);

    // Draf tersimpan dipulihkan lebih dulu; RAG hanya jalan jika belum ada draf.
    useEffect(() => {
        if (!savedDraft) return;
        autoGeneratedRef.current = true;
        setDraft((current) => ({ ...current, ...savedDraft }));
    }, [savedDraft]);

  // Draf awal dihasilkan sekali oleh Recommendation System (RAG + LLM).
  // Tidak ada tombol "rekomendasi lain": hasil pertama langsung bisa diedit Ketua PKK.
  useEffect(() => {
    if (!communityDraftsLoaded) return;
    if (savedDraft || publishedId) return;

    let cancelled = false;

    async function generateRecommendation() {
        const reportText = [
            ...reports.flatMap((item, index) => [
                `Laporan ${index + 1}: ${item.title}`,
                item.details,
                `Kategori: ${categoryCluster(item)}`,
                `Lokasi: ${incidentLocation(item)}`,
            ]),
            `Wilayah klaster: ${regionalCluster(report)}`,
        ].filter(Boolean).join('\n');

        try {
            const response = await fetch('/api/admin/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report: reportText,
                    regionId: report.regionId || null,
                    topK: 2,
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Gagal membuat rekomendasi');

            const generated = result.draft && typeof result.draft === 'object'
                ? result.draft
                : null;

            if (generated) {
                if (cancelled) return;
                setDraft((current) => ({
                    ...current,
                    ...generated,
                    steps: generated.steps || current.steps,
                }));
                return;
            }

            const selected = Array.isArray(result.results) ? result.results[0] : null;
            if (!selected?.kegiatan) return;

            const steps = Array.isArray(selected.langkah)
                ? selected.langkah.map((step) => String(step).trim()).filter(Boolean).join('\n')
                : String(selected.langkah || '').trim();

            if (cancelled) return;

            setDraft((current) => ({
                ...current,
                name: `${selected.kegiatan}: ${report.title}`,
                description: `Rekomendasi AI untuk menangani ${reports.map((item) => item.title).join(', ')} di ${incidentLocation(report)}.`,
                steps: steps || current.steps,
            }));
        } catch (error) {
            console.error('Gagal memuat rekomendasi backend:', error);
        }
    }

    generateRecommendation();

    return () => {
        cancelled = true;
    };
}, [sourceId, savedDraft, publishedId, report.regionId, communityDraftsLoaded]);
    async function saveDraft() {
    const saved = await saveCommunityDraft?.({
        clusterKey: sourceId,
        regionId: report.regionId || null,
        reportIds,
        draft: { ...draft, location: incidentLocation(report), category: categoryCluster(report) },
    });

    if (saved === false) {
        alert('Gagal menyimpan draf. Silakan coba lagi.');
        return;
    }

    setEditing(false);
    setDraftOpen(true);
}

    async function publishDraft() {
    const id = await publishCommunityAction?.({
        clusterKey: sourceId,
        regionId: report.regionId || null,
        reportIds,
        draft: { ...draft, location: incidentLocation(report), category: categoryCluster(report) },
    });

    if (!id) {
        alert('Gagal menerbitkan aksi. Silakan coba lagi.');
        return;
    }

    reports.forEach((item) => {
        recordTimelineActivity(
            item.id,
            'handling',
            'Aksi komunitas diterbitkan',
            `Laporan tergabung dalam aksi "${draft.name}" (ID: ${id}).`
        );

        startCommunityHandling(item.id, String(id), draft.name);
    });

    setPublishedId(String(id));
}
    const fieldClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-slate-500';

    const statusBadge = publishedId
        ? { label: 'Tayang', className: 'bg-brand-light text-brand-dark' }
        : editing
            ? { label: 'Sedang diedit', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' }
            : { label: 'Siap diterbitkan', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' };
    function startEditing() {
        setEditing(true);
        setDraftOpen(true);
    }

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-brand-dark"><Users className="h-3.5 w-3.5"/> Jalur B · Aksi Komunitas</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">3 pelapor terpenuhi</span>
                    </div>
                    <h3 className="mt-2 text-base font-black text-slate-900">{draft.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MapPin className="h-3.5 w-3.5 text-brand"/> {incidentLocation(report)} · {categoryCluster(report)}</p>
                </div>
                <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', statusBadge.className)}>{publishedId ? <CheckCircle2 className="h-3.5 w-3.5"/> : <CircleDot className="h-3.5 w-3.5"/>} {statusBadge.label}</span>
            </header>

            <div className="grid items-start gap-4 p-5 lg:grid-cols-2">
                <section className="overflow-hidden rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setReportsOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50" aria-expanded={reportsOpen}>
                        <span className="flex items-center gap-2 text-sm font-black text-slate-800"><FileText className="h-4 w-4 text-brand"/> Daftar Laporan Pembentuk</span>
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
        onClick={editing ? saveDraft : startEditing}
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
        </article>
    );
}

export default function AIAssistant() {
    const { areaLabel } = useAdmin();
    const {
    reports,
    communityDrafts,
    communityDraftsLoaded,
    approveReport,
    saveEmergencyDraft,
    finalizeReport,
    recordTimelineActivity,
    startCommunityHandling,
    saveCommunityDraft,
    publishCommunityAction,
} = useReportContext();

const searchParams = useSearchParams();

const [queue, setQueue] = useState(
    searchParams.get('queue') === 'emergency' ? 'emergency' : 'community'
);

// Jalur final ditentukan Ketua PKK di Dashboard, bukan rekomendasi AI.
// Hanya laporan yang sudah diterima yang masuk antrean Asisten AI.
const eligibleReports = reports.filter((report) =>
    report.dashboardDecision === 'accepted' &&
    !['rejected', 'resolved', 'handled'].includes(report.status) &&
    !report.recommendationDecision
);

// Jalur A: laporan darurat yang diterima dan sedang/akan ditangani.
const emergencyReports = eligibleReports.filter(
    (report) =>
        report.dashboardRoute === 'emergency' &&
        ['in_review', 'in_progress'].includes(report.status)
);

// Jalur B: laporan yang masih berada di tabungan aksi (belum diterbitkan).
// Setelah diterbitkan, statusnya in_progress dan ditampilkan di Manajemen Aksi.
const communityReports = eligibleReports.filter(
    (report) =>
        report.dashboardRoute === 'community' &&
        report.status === 'in_review'
);

// Klaster berdasarkan kategori laporan dan wilayah.
const allCommunityClusters = Array.from(
    communityReports.reduce((clusters, report) => {
        const key = clusterKey(report);
        const current = clusters.get(key) || [];
        current.push(report);
        clusters.set(key, current);
        return clusters;
    }, new Map()).values()
);

const maturedClusters = allCommunityClusters.filter((cluster) => {
    const uniqueReporters = new Set(
        cluster
            .map((report) => report.userId || report.reporter?.trim().toLowerCase())
            .filter(Boolean)
    ).size;

    return uniqueReporters >= 3;
});

const readyClusters = maturedClusters;

const publishedActionIds = new Set(
    reports
        .filter((report) => report.dashboardRoute === 'community' && report.communityActionId)
        .map((report) => String(report.communityActionId))
);

    const metrics = [
        { label: 'Total Dianalisis', value: reports.length, icon: Bot, tone: 'bg-slate-100 text-slate-700' },
        { label: 'Siap Diterbitkan', value: readyClusters.length, icon: Sparkles, tone: 'bg-amber-100 text-amber-800' },
        { label: 'Aksi Diterbitkan', value: publishedActionIds.size, icon: CheckCircle2, tone: 'bg-brand-light text-brand' },
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
                recordTimelineActivity={recordTimelineActivity}
                startCommunityHandling={startCommunityHandling}
                communityDrafts={communityDrafts}
                communityDraftsLoaded={communityDraftsLoaded}
                saveCommunityDraft={saveCommunityDraft}
                publishCommunityAction={publishCommunityAction}
            />
        ))
    }
</div>
            </section>

        </div>
    );
}
