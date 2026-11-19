'use client';

import { cn } from '@/lib/utils';
import { usePrakiraan } from '@/lib/hooks/info/useBmkgCards';
import { IkonCuaca } from './Ikon';

export default function StripPrakiraan() {
  const slots = usePrakiraan();
  if (!slots?.length) return null;

  return (
    <div
      role="region"
      aria-label="Prakiraan cuaca per 3 jam"
      tabIndex={0}
      className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:mx-0 sm:px-0"
    >
      {slots.map((s, i) => (
        <div
          key={i}
          className={cn(
            'flex w-24 shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-3 text-center sm:w-auto sm:min-w-0 sm:flex-1 sm:shrink',
            i === 0 ? 'border-brand bg-brand-light' : 'border-border bg-white'
          )}
        >
          <p className={cn('text-[13px] font-black', i === 0 ? 'text-brand' : 'text-foreground')}>{s.jam}</p>
          <div className="my-2 flex h-10 w-10 items-center justify-center">
            <IkonCuaca url={s.ikon} kondisi={s.kondisi} ukuran="h-9 w-9" />
          </div>
          <p className="text-xl font-black leading-none text-foreground">{s.suhu}°</p>
          <p className="mt-1.5 line-clamp-2 min-h-[2.4em] text-[13px] leading-tight text-muted-foreground">
            {s.kondisi}
          </p>
        </div>
      ))}
    </div>
  );
}