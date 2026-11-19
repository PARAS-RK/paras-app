'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, Copy, Info, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/info/status';
import { useSalin } from '@/lib/hooks/info/useSalin';
import { LogoWA } from './Ikon';

export default function KartuInfo({
  status = 'normal', judul, lencana, ikon, ringkasan, ekstra, catatan, detail, diambil, pesan,
}) {
  const [buka, setBuka] = useState(false);
  const [bagikanBuka, setBagikanBuka] = useState(false);
  const { status: salinStatus, salin } = useSalin(pesan);

  const gaya = STATUS[status] ?? STATUS.normal;
  const teksLencana = lencana ?? gaya.lencana?.teks;
  const kelasLencana = gaya.lencana?.kelas ?? 'bg-slate-600 text-white';

  const potong = status === 'normal' || status === 'aman';
  const adaTombolBuka = Boolean(detail) || potong;
  const bisaBagikan = Boolean(pesan) && status !== 'tidak_pasti';

  let ikonTampil = ikon;
  if (status === 'aman') ikonTampil = <ShieldCheck className="h-10 w-10 text-brand" aria-hidden />;
  if (status === 'tidak_pasti') ikonTampil = <Info className="h-10 w-10 text-slate-500" aria-hidden />;

  return (
    <article className={cn('flex flex-col rounded-2xl border p-4 sm:p-5', gaya.kartu)}>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
          {ikonTampil}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black leading-snug text-foreground">{judul}</h2>
          {teksLencana && (
            <span className={cn('mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs font-black', kelasLencana)}>
              {teksLencana}
            </span>
          )}
        </div>
      </div>

      <p className={cn('mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground', potong && !buka && 'line-clamp-3')}>
        {ringkasan}
      </p>

      {ekstra && <div className="mt-2 flex flex-wrap items-center gap-2">{ekstra}</div>}
      {catatan && <p className="mt-2 text-xs text-muted-foreground">{catatan}</p>}
      {detail && buka && <div className="mt-3">{detail}</div>}

      {bisaBagikan && bagikanBuka && (
        <div className="mt-3 rounded-xl border border-border bg-white p-3">
          <p className="text-xs font-semibold text-muted-foreground">Pesan yang akan dibagikan</p>
          <pre className="mt-2 max-h-56 select-text overflow-auto whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-foreground">
            {pesan}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(pesan)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#128C7E] px-3 text-sm font-bold text-white hover:bg-[#0f7a6e]"
            >
              <LogoWA className="h-4 w-4" /> Kirim lewat WhatsApp
            </a>
            <button
              type="button"
              onClick={salin}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold',
                salinStatus === 'tersalin' ? 'border-slate-300 bg-slate-200 text-slate-700' : 'border-border bg-white text-foreground hover:bg-muted'
              )}
            >
              {salinStatus === 'tersalin' ? <><Check className="h-4 w-4" /> Tersalin</> : <><Copy className="h-4 w-4" /> Salin</>}
            </button>
          </div>
          {salinStatus === 'gagal' && (
            <p className="mt-2 text-xs text-muted-foreground">Gagal menyalin. Tekan lama pada teks lalu salin manual.</p>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {bisaBagikan && (
            <button
              type="button"
              onClick={() => setBagikanBuka(!bagikanBuka)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-bold text-foreground hover:bg-muted"
            >
              <LogoWA className="h-4 w-4 text-[#25D366]" /> Bagikan
            </button>
          )}
          {adaTombolBuka && (
            <button
              type="button"
              onClick={() => setBuka(!buka)}
              className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              {buka ? <>Sembunyikan <ChevronUp className="h-4 w-4" /></> : <>Selengkapnya <ChevronDown className="h-4 w-4" /></>}
            </button>
          )}
        </div>
        {diambil && (
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Diambil {diambil}
          </p>
        )}
      </div>
    </article>
  );
}