'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, FileText, ChevronLeft, ChevronRight, MessageCircle, User, Bell, HandHeart, Lock, Shield, Users, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGIN_PATH = '/login';
const PROFILE_PATH = '/profil';

const RejectedReportFeedback = () => (
  <div className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
    <p className="font-bold mb-1">Berikan Umpan Balik</p>
    <p className="text-xs">Bantu kami memahami mengapa laporan ini tidak valid.</p>
  </div>
);
const ReportFollowUp = () => (
  <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 border border-gray-100">
    <p className="font-bold mb-1">Tindak Lanjut</p>
    <p className="text-xs">Kirimkan pembaruan mengenai laporan Anda.</p>
  </div>
);

// Kunci status diterjemahkan dari status database oleh API (lib/pantau-server.js)
const statusConfig = {
  pending: { label: 'Terkirim', pill: 'bg-gray-100 text-gray-600 border border-gray-200', icon: FileText, step: 0 },
  in_progress: { label: 'Diproses', pill: 'bg-blue-50 text-blue-600 border border-blue-200', icon: Loader2, step: 1 },
  handled: { label: 'Ditangani', pill: 'bg-green-50 text-[#159038] border border-green-200', icon: CheckCircle2, step: 2 },
  rejected: { label: 'Ditolak', pill: 'bg-red-50 text-red-600 border border-red-200', icon: XCircle, step: -1 },
};

const filterOptions = [
  ['all', 'Semua'],
  ['pending', 'Terkirim'],
  ['in_progress', 'Diproses'],
  ['handled', 'Ditangani'],
  ['rejected', 'Ditolak'],
];

const stepLabels = ['Terkirim', 'Diproses', 'Ditangani'];
const trackingSteps = ['Pilih Laporan', 'Status', 'Detail & Tindak Lanjut'];

class UnauthorizedError extends Error {}

async function api(url, options) {
  const res = await fetch(url, { cache: 'no-store', ...options });
  if (res.status === 401) throw new UnauthorizedError('Sesi berakhir');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan. Silakan coba lagi.');
  return data;
}

function listUrl({ owner, filter, query, page }) {
  const params = new URLSearchParams({ scope: owner, status: filter, page: String(page) });
  if (query) params.set('q', query);
  return `/api/pantau?${params}`;
}

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

function handlerTitle(handledBy) {
  if (handledBy === 'bpbd') return 'Tim BPBD sedang menangani';
  if (handledBy === 'pkk') return 'Komunitas PKK sedang menangani';
  return 'Laporan sedang diproses';
}

function Spinner({ label = 'Memuat' }) {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label={label}>
      <Loader2 className="h-7 w-7 animate-spin text-[#159038]" />
    </div>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" aria-hidden />
      <p className="max-w-xs text-sm text-gray-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full bg-[#159038] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700">
          Coba lagi
        </button>
      )}
    </div>
  );
}

function OwnerBadge({ report }) {
  return report.isMine ? (
    <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-[#159038] border border-green-100">
      <User className="h-3 w-3" /> Anda
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
      <Users className="h-3 w-3" /> {report.reporter}
    </span>
  );
}

function OwnerInfo({ report, onToggleVote, voting, voteError }) {
  if (report.isMine) {
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
        <span className="text-xs font-medium text-amber-800">{report.voteCount > 0 ? `${report.voteCount} warga juga mengalami ini` : 'Belum ada warga yang menyatakan mengalami ini'}</span>
        <button
          type="button"
          onClick={onToggleVote}
          disabled={voting}
          aria-pressed={report.hasVoted}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60',
            report.hasVoted ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-100',
          )}
        >
          <HandHeart className="h-3.5 w-3.5" /> {report.hasVoted ? 'Didukung' : 'Saya juga mengalami'}
        </button>
      </div>
      {voteError && <p className="text-xs font-medium text-red-600">{voteError}</p>}
    </div>
  );
}

function ReportStatusPanel({ report }) {
  const cfg = statusConfig[report.status] ?? statusConfig.pending;
  const isRejected = report.status === 'rejected';
  const stepIndex = isRejected ? -1 : cfg.step;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-sm transition-all',
        report.status === 'in_progress' ? 'border-blue-200' : report.status === 'handled' ? 'border-green-200' : report.status === 'rejected' ? 'border-red-200' : 'border-gray-200',
      )}
    >
      <div className="p-4 lg:p-5">
        <div className="mb-3 flex items-start gap-2">
          <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-mono text-gray-500">{report.ticketCode}</span>
          <OwnerBadge report={report} />
          <span className={cn('ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold', cfg.pill)}>
            <cfg.icon className={cn('h-3.5 w-3.5', report.status === 'in_progress' && 'animate-spin')} />
            {cfg.label}
          </span>
        </div>

        <h3 className="mb-1 text-base font-black text-gray-900">{report.title}</h3>
        <p className="mb-0.5 flex items-center gap-1 text-xs text-gray-500">
          📍 {report.area}
          {report.location ? ` · ${report.location}` : ''}
        </p>
        <p className="text-xs font-medium text-gray-400">{formatDate(report.createdAt)}</p>

        {/* Status timeline */}
        {!isRejected ? (
          <div className="mt-6">
            <div className="flex items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-1 items-center">
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                      i <= stepIndex ? 'bg-[#159038] text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200',
                    )}
                  >
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className={cn('h-1 flex-1 transition-colors', i < stepIndex ? 'bg-[#159038]' : 'bg-gray-100')} />}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between px-1">
              {stepLabels.map((l, idx) => (
                <span key={l} className={cn('flex-1 text-[10px] font-bold text-center', idx <= stepIndex ? 'text-gray-900' : 'text-gray-400')}>
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
                <span className="font-bold">Alasan: </span>
                {report.rejectionReason}
              </p>
            ) : (
              <p className="text-xs text-red-600">Laporan ini tidak dapat ditindaklanjuti. Hubungi PARAS jika ada pertanyaan.</p>
            )}
          </div>
        )}

        {isRejected && report.isMine && <RejectedReportFeedback />}

        {/* Pesan publik dari penangan */}
        {report.status === 'in_progress' && report.publicMessage && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              {report.handledBy === 'bpbd' ? <Shield className="h-4 w-4 shrink-0 text-blue-600" /> : <Users className="h-4 w-4 shrink-0 text-blue-600" />}
              <p className="text-xs font-black text-blue-700">{handlerTitle(report.handledBy)}</p>
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

function ReportDetailPanel({ report, onToggleVote, voting, voteError }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Isi Laporan</p>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-900">{report.details}</p>
        </div>

        {report.media?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Bukti Foto</p>
            <div className="grid grid-cols-2 gap-2">
              {report.media.map((m, i) => (
                <img key={i} src={m.url} alt={`Bukti laporan ${i + 1}`} loading="lazy" className="aspect-video w-full rounded-xl border border-gray-200 object-cover" />
              ))}
            </div>
          </div>
        )}

        {report.handledBy && (
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            {report.handledBy === 'bpbd' ? (
              <>
                <Shield className="h-4 w-4" /> Ditangani oleh BPBD
              </>
            ) : (
              <>
                <Users className="h-4 w-4" /> Ditangani oleh Komunitas PKK
              </>
            )}
          </div>
        )}

        {report.timeline?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Riwayat Status</p>
            <ol className="space-y-3 border-l-2 border-gray-100 pl-4">
              {report.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[#159038]" />
                  <p className="text-xs font-bold text-gray-900">
                    {statusConfig[t.status]?.label ?? t.status}
                    <span className="font-medium text-gray-400"> · {formatDate(t.createdAt)}</span>
                  </p>
                  {t.note && <p className="text-xs leading-relaxed text-gray-600">{t.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}

        <OwnerInfo report={report} onToggleVote={onToggleVote} voting={voting} voteError={voteError} />
        {report.isMine && <ReportFollowUp />}
      </div>
    </div>
  );
}

export default function ReportTracking() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [owner, setOwner] = useState('mine');
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const [list, setList] = useState({ items: [], page: 1, hasMore: false, total: 0, notice: null });
  const [listStatus, setListStatus] = useState('loading'); // loading | ready | error
  const [listError, setListError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle'); // idle | loading | ready | error
  const [detailError, setDetailError] = useState('');
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState('');

  const goToLogin = () => router.replace(`${LOGIN_PATH}?next=/pantau`);

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Muat daftar laporan setiap tab / filter / pencarian berubah
  useEffect(() => {
    const controller = new AbortController();
    setListStatus('loading');
    setListError('');

    api(listUrl({ owner, filter, query, page: 1 }), { signal: controller.signal })
      .then((data) => {
        setList({ items: data.items, page: data.page, hasMore: data.hasMore, total: data.total, notice: data.notice ?? null });
        setListStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err instanceof UnauthorizedError) return goToLogin();
        setListError(err.message);
        setListStatus('error');
      });

    return () => controller.abort();
  }, [owner, filter, query, reloadKey]);

  // Muat detail saat sebuah laporan dipilih
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setDetailStatus('idle');
      return;
    }
    const controller = new AbortController();
    setDetailStatus('loading');
    setDetailError('');
    setVoteError('');

    api(`/api/pantau/${selectedId}`, { signal: controller.signal })
      .then((data) => {
        setSelected(data.report);
        setDetailStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err instanceof UnauthorizedError) return goToLogin();
        setDetailError(err.message);
        setDetailStatus('error');
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, reloadKey]);

  async function handleLoadMore() {
    if (loadingMore || !list.hasMore) return;
    setLoadingMore(true);
    try {
      const data = await api(listUrl({ owner, filter, query, page: list.page + 1 }));
      setList((prev) => {
        const known = new Set(prev.items.map((r) => r.id));
        return {
          ...prev,
          items: [...prev.items, ...data.items.filter((r) => !known.has(r.id))],
          page: data.page,
          hasMore: data.hasMore,
          total: data.total,
        };
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) return goToLogin();
      setListError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleToggleVote() {
    if (!selected || voting) return;
    const next = !selected.hasVoted;
    const delta = next ? 1 : -1;

    setVoting(true);
    setVoteError('');
    //Tampilkan dulu, batalkan jika server menolak
    setSelected((s) => ({ ...s, hasVoted: next, voteCount: Math.max(0, s.voteCount + delta) }));

    try {
      const data = await api(`/api/pantau/${selected.id}/vote`, { method: next ? 'POST' : 'DELETE' });
      setSelected((s) => ({ ...s, hasVoted: data.hasVoted, voteCount: data.voteCount }));
    } catch (err) {
      if (err instanceof UnauthorizedError) return goToLogin();
      setSelected((s) => ({ ...s, hasVoted: !next, voteCount: Math.max(0, s.voteCount - delta) }));
      setVoteError(err.message);
    } finally {
      setVoting(false);
    }
  }

  function handleOwnerChange(value) {
    setOwner(value);
    if (value === 'community' && filter === 'rejected') setFilter('all');
  }

  function openReport(id) {
    setSelectedId(id);
    setStep(1);
  }

  function backToList() {
    setStep(0);
    setSelectedId(null);
  }

  function goBack() {
    if (step === 1) backToList();
    else setStep(1);
  }

  const visibleFilters = owner === 'community' ? filterOptions.filter(([val]) => val !== 'rejected') : filterOptions;

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
                      i < step ? 'bg-[#159038] text-white' : i === step ? 'bg-[#159038] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn('whitespace-nowrap text-[10px] font-bold', i === step ? 'text-[#159038]' : 'text-gray-400')}>{label}</span>
                </div>
                {i < trackingSteps.length - 1 && <div className={cn('mx-3 mb-6 h-0.5 flex-1 transition-colors', i < step ? 'bg-[#159038]' : 'bg-gray-100')} />}
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
                aria-label="Cari laporan"
                placeholder="Cari isi laporan atau nomor laporan..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#159038] focus:ring-1 focus:ring-[#159038]"
              />
            </div>

            {/* Tab Laporan Saya / Warga */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1.5" role="tablist">
              {[
                ['mine', 'Laporan Saya'],
                ['community', 'Laporan Warga'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  role="tab"
                  aria-selected={owner === val}
                  onClick={() => handleOwnerChange(val)}
                  className={cn('rounded-lg py-2.5 text-xs font-bold transition-all', owner === val ? 'bg-white text-[#159038] shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filter Status Pills */}
            <div className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
              {visibleFilters.map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFilter(val)}
                  aria-pressed={filter === val}
                  className={cn('shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors', filter === val ? 'border-[#159038] bg-[#159038] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* List Laporan */}
            <div className="mt-2 flex flex-col gap-3">
              {listStatus === 'loading' && <Spinner label="Memuat laporan" />}

              {listStatus === 'error' && <ErrorBox message={listError} onRetry={() => setReloadKey((k) => k + 1)} />}

              {listStatus === 'ready' &&
                list.items.map((r) => {
                  const cfg = statusConfig[r.status] ?? statusConfig.pending;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => openReport(r.id)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#159038] hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-400">{r.ticketCode}</span>
                          <OwnerBadge report={r} />
                          <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', cfg.pill)}>
                            <cfg.icon className="h-3 w-3" /> {cfg.label}
                          </span>
                        </div>
                        <p className="truncate text-base font-bold text-gray-900">{r.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-600">{r.excerpt}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {r.area} · {formatDate(r.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                    </button>
                  );
                })}

              {listStatus === 'ready' && list.hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="mx-auto flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                >
                  {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Muat lebih banyak
                </button>
              )}

              {listStatus === 'ready' && list.items.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  {list.notice === 'no_region' ? (
                    <>
                      <p className="text-lg font-bold text-gray-900">Wilayah belum diisi</p>
                      <p className="mb-6 mt-1 text-sm text-gray-500">Lengkapi wilayah pada profil Anda untuk melihat laporan warga di kelurahan Anda.</p>
                      <Link href={PROFILE_PATH} className="inline-flex items-center gap-2 rounded-xl bg-[#159038] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700">
                        Lengkapi Profil
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-gray-900">Tidak ada laporan ditemukan</p>
                      <p className="mb-6 mt-1 text-sm text-gray-500">
                        {list.notice === 'blocked' ? 'Akun Anda tidak dapat melihat laporan warga saat ini.' : owner === 'mine' ? 'Anda belum membuat laporan yang sesuai filter ini.' : 'Belum ada warga yang melapor di filter ini.'}
                      </p>
                      {owner === 'mine' && (
                        <Link href="/lapor" className="inline-flex items-center gap-2 rounded-xl bg-[#E6008A] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105">
                          Buat Laporan Baru
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step > 0: Status / Detail Laporan */}
        {step > 0 && (
          <div className="space-y-4">
            {detailStatus === 'loading' && <Spinner label="Memuat laporan" />}

            {detailStatus === 'error' && <ErrorBox message={detailError} onRetry={() => setReloadKey((k) => k + 1)} />}

            {detailStatus === 'ready' && selected && (step === 1 ? <ReportStatusPanel report={selected} /> : <ReportDetailPanel report={selected} onToggleVote={handleToggleVote} voting={voting} voteError={voteError} />)}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={goBack} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" /> Kembali
              </button>

              {detailStatus === 'ready' &&
                (step === 1 ? (
                  <button type="button" onClick={() => setStep(2)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#159038] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700">
                    Detail laporan <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={backToList} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#159038] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700">
                    Pilih laporan lain
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
