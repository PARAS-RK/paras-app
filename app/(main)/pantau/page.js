'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, CheckCircle2, FileText, ChevronLeft, ChevronRight, MessageCircle, User, Bell, HandHeart, Lock, Shield, Users, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReportContext } from '@/context/ReportContext';
// import { areaLabel } from '@/lib/currentUser'; 

// --- Komponen Placeholder Sementara ---
// Hapus atau ganti impor ini jika file aslinya sudah Anda buat di folder komponen.
const areaLabel = "Kel. Kebayoran Baru";
const RejectedReportFeedback = ({ report }) => (
  <div className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
    <p className="font-bold mb-1">Berikan Umpan Balik</p>
    <p className="text-xs">Bantu kami memahami mengapa laporan ini tidak valid.</p>
  </div>
);
const ReportFollowUp = ({ report }) => (
  <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 border border-gray-100">
    <p className="font-bold mb-1">Tindak Lanjut</p>
    <p className="text-xs">Kirimkan pembaruan mengenai laporan Anda.</p>
  </div>
);
// --------------------------------------

const statusConfig = {
  pending: { label: 'Terkirim', pill: 'bg-gray-100 text-gray-600 border border-gray-200', icon: FileText, step: 0 },
  in_progress: { label: 'Diproses', pill: 'bg-blue-50 text-blue-600 border border-blue-200', icon: Loader2, step: 1 },
  handled: { label: 'Ditangani', pill: 'bg-green-50 text-[#159038] border border-green-200', icon: CheckCircle2, step: 2 },
  rejected: { label: 'Ditolak', pill: 'bg-red-50 text-red-600 border border-red-200', icon: XCircle, step: -1 },
};

// Demo ownership: reports sent by the signed-in resident.
const MY_REPORT_IDS = new Set(['LP-2024-089', 'LP-2024-082']);
const isMine = (report) => MY_REPORT_IDS.has(report.id);

function OwnerBadge({ report }) {
  return isMine(report) ? (
    <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-[#159038] border border-green-100">
      <User className="h-3 w-3" /> Anda
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
      <Users className="h-3 w-3" /> {report.reporter}
    </span>
  );
}

function OwnerInfo({ report }) {
  const [supported, setSupported] = useState(false);
  
  if (isMine(report)) {
    return (
      <div className="space-y-1.5 rounded-xl border border-green-100 bg-green-50/50 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-black text-[#159038]">
          <User className="h-3.5 w-3.5" /> Dilaporkan oleh Anda
        </p>
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-green-900">
          <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" /> 
          Anda akan menerima notifikasi setiap kali status laporan ini berubah, dan dapat memberi tindak lanjut.
        </p>
      </div>
    );
  }
  
  const base = 4 + (report.urgency % 5);
  return (
    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-black text-amber-800">
        <Users className="h-3.5 w-3.5" /> Dilaporkan oleh {report.reporter}
      </p>
      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-800">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> 
        Anda dapat memantau dan mendukung laporan ini, namun tindak lanjut hanya dilakukan oleh pelapor.
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-amber-800">{base + (supported ? 1 : 0)} warga juga mengalami ini</span>
        <button 
          type="button" 
          onClick={() => setSupported(!supported)} 
          className={cn(
            'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors', 
            supported ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-100'
          )}
        >
          <HandHeart className="h-3.5 w-3.5" /> {supported ? 'Didukung' : 'Saya juga mengalami'}
        </button>
      </div>
    </div>
  );
}

const stepLabels = ['Terkirim', 'Diproses', 'Ditangani'];

function ReportStatusPanel({ report }) {
  const cfg = statusConfig[report.status];
  const isRejected = report.status === 'rejected';
  const stepIndex = isRejected ? -1 : cfg.step;

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border bg-white shadow-sm transition-all', 
      report.status === 'in_progress' ? 'border-blue-200' :
      report.status === 'handled' ? 'border-green-200' :
      report.status === 'rejected' ? 'border-red-200' : 'border-gray-200'
    )}>
      <div className="p-4 lg:p-5">
        <div className="mb-3 flex items-start gap-2">
          <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-mono text-gray-500">
            #{report.id}
          </span>
          <OwnerBadge report={report} />
          <span className={cn('ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold', cfg.pill)}>
            <cfg.icon className={cn('h-3.5 w-3.5', report.status === 'in_progress' && 'animate-spin')} />
            {cfg.label}
          </span>
        </div>

        <h3 className="mb-1 text-base font-black text-gray-900">{report.title}</h3>
        <p className="mb-0.5 flex items-center gap-1 text-xs text-gray-500">
          📍 {report.area}
        </p>
        <p className="text-xs font-medium text-gray-400">{report.date}</p>

        {/* Status timeline */}
        {!isRejected ? (
          <div className="mt-6">
            <div className="flex items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-1 items-center">
                  <div className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors', 
                    i <= stepIndex ? 'bg-[#159038] text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200'
                  )}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  {i < 2 && (
                    <div className={cn('h-1 flex-1 transition-colors', i < stepIndex ? 'bg-[#159038]' : 'bg-gray-100')} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between px-1">
              {stepLabels.map((l, idx) => (
                <span key={l} className={cn(
                  "flex-1 text-[10px] font-bold text-center",
                  idx <= stepIndex ? "text-gray-900" : "text-gray-400"
                )}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs font-black text-red-700">Laporan Ditolak</p>
            </div>
            {report.rejectionReason ? (
              <p className="text-xs leading-relaxed text-red-700">
                <span className="font-bold">Alasan: </span>{report.rejectionReason}
              </p>
            ) : (
              <p className="text-xs text-red-600">Laporan ini tidak dapat ditindaklanjuti. Hubungi PARAS jika ada pertanyaan.</p>
            )}
          </div>
        )}

        {isRejected && isMine(report) && <RejectedReportFeedback report={report} />}

        {/* Inline Public Messages */}
        {report.status === 'in_progress' && report.publicMessage && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              {report.handledBy === 'bpbd' ? <Shield className="h-4 w-4 shrink-0 text-blue-600" /> : <Users className="h-4 w-4 shrink-0 text-blue-600" />}
              <p className="text-xs font-black text-blue-700">
                {report.handledBy === 'bpbd' ? 'Tim BPBD sedang menangani' : 'Komunitas PKK sedang menangani'}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-blue-700">{report.publicMessage}</p>
          </div>
        )}

        {report.status === 'handled' && report.publicMessage && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#159038]" />
              <p className="text-xs font-black text-[#159038]">Laporan telah ditangani</p>
            </div>
            <p className="text-xs leading-relaxed text-green-900">{report.publicMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportDetailPanel({ report }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Isi Laporan</p>
          <p className="text-sm leading-relaxed text-gray-900">{report.details}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          {report.handledBy === 'bpbd' ? (
            <><Shield className="h-4 w-4" /> Ditangani oleh BPBD</>
          ) : (
            <><Users className="h-4 w-4" /> Ditangani oleh Komunitas PKK</>
          )}
        </div>
        <OwnerInfo report={report} />
        {isMine(report) && <ReportFollowUp report={report} />}
      </div>
    </div>
  );
}

const trackingSteps = ['Pilih Laporan', 'Status', 'Detail & Tindak Lanjut'];

export default function ReportTracking() {
  // const { reports } = useReportContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [owner, setOwner] = useState('mine');
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  
  // Mengambil contoh laporan yang memiliki semua status
  const examples = ['in_progress', 'handled', 'rejected', 'pending']
    // .map((status) => reports.find((r) => r.status === status))
    .filter(Boolean);
    
  // const sample = [...examples, ...reports.filter((r) => !examples.includes(r))]
  //   .slice(0, 5)
  //   .map((r) => ({ ...r, area: areaLabel }));
    
  // const filtered = sample.filter((r) => {
  //   const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search);
  //   const matchFilter = filter === 'all' || r.status === filter;
  //   const matchOwner = (owner === 'mine') === isMine(r);
  //   return matchSearch && matchFilter && matchOwner;
  // });
  
  // const selected = sample.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 pb-20">
      {/* Header & Stepper */}
      <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-black text-gray-900">Pantau Laporan</h1>
          <p className="mb-6 mt-1 text-sm text-gray-500">Lacak status laporan Anda dan laporan warga di sekitar Anda</p>
          
          <ol className="flex items-center" aria-label="Langkah pantau laporan">
            {trackingSteps.map((label, i) => (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span 
                    aria-current={i === step ? 'step' : undefined} 
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all', 
                      i < step ? 'bg-[#159038] text-white' : 
                      i === step ? 'bg-[#159038] text-white ring-4 ring-green-100' : 
                      'bg-gray-100 text-gray-400'
                    )}
                  >
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn('whitespace-nowrap text-[10px] font-bold', i === step ? 'text-[#159038]' : 'text-gray-400')}>
                    {label}
                  </span>
                </div>
                {/* Perbaikan Operator Matematika: - 1 bukan 1 */}
                {i < trackingSteps.length - 1 && (
                  <div className={cn('mx-3 mb-6 h-0.5 flex-1 transition-colors', i < step ? 'bg-[#159038]' : 'bg-gray-100')} />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-10">
        {/* Step 0: Pilih Laporan */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Cari laporan atau nomor resi..." 
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#159038] focus:ring-1 focus:ring-[#159038]" 
              />
            </div>
            
            {/* Tab Laporan Saya / Warga */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1.5" role="tablist">
              {[['mine', 'Laporan Saya'], ['community', 'Laporan Warga']].map(([val, label]) => (
                <button 
                  key={val} 
                  type="button" 
                  role="tab" 
                  aria-selected={owner === val} 
                  onClick={() => setOwner(val)} 
                  className={cn(
                    'rounded-lg py-2.5 text-xs font-bold transition-all', 
                    owner === val ? 'bg-white text-[#159038] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filter Status Pills */}
            <div className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
              {[
                ['all', 'Semua'],
                ['pending', 'Terkirim'],
                ['in_progress', 'Diproses'],
                ['handled', 'Ditangani'],
                ['rejected', 'Ditolak'],
              ].map(([val, label]) => (
                <button 
                  key={val} 
                  onClick={() => setFilter(val)} 
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors', 
                    filter === val ? 'border-[#159038] bg-[#159038] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* List Laporan */}
            <div className="mt-2 flex flex-col gap-3">
              {/* {filtered.map((r) => { */}
                const cfg = statusConfig[r.status];
                return (
                  <button 
                    // key={r.id} 
                    type="button" 
                    onClick={() => { setSelectedId(r.id); setStep(1); }} 
                    className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#159038] hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {/* <span className="text-[10px] font-mono text-gray-400">#{r.id}</span> */}
                        {/* <OwnerBadge report={r} /> */}
                        {/* <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', cfg.pill)}>
                          <cfg.icon className="h-3 w-3" /> {cfg.label}
                        </span> */}
                      </div>
                      {/* <p className="truncate text-base font-bold text-gray-900">{r.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{r.area} · {r.date}</p> */}
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                  </button>
                );
              {/* })} */}

              {/* {filtered.length === 0 && ( */}
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">Tidak ada laporan ditemukan</p>
                  <p className="mb-6 mt-1 text-sm text-gray-500">
                    {owner === 'mine' ? 'Anda belum membuat laporan yang sesuai filter ini.' : 'Belum ada warga yang melapor di filter ini.'}
                  </p>
                  {owner === 'mine' && (
                    <Link href="/lapor" className="inline-flex items-center gap-2 rounded-xl bg-[#E6008A] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105">
                      Buat Laporan Baru
                    </Link>
                  )}
                </div>
              {/* )} */}
            </div>
          </div>
        )}

        {/* Step > 0: Detail/Status Laporan */}
        {step > 0 && selected && (
          <div className="space-y-4">
            {step === 1 ? <ReportStatusPanel report={selected} /> : <ReportDetailPanel report={selected} />}
            
            <div className="flex gap-3 pt-2">
              {/* Perbaikan Operator Matematika: - 1 bukan 1 */}
              <button 
                type="button" 
                onClick={() => setStep(step - 1)} 
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> Kembali
              </button>
              
              {step === 1 ? (
                <button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#159038] py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700 shadow-sm"
                >
                  Detail laporan <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => { setStep(0); setSelectedId(null); }} 
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#159038] py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700 shadow-sm"
                >
                  Pilih laporan lain
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}