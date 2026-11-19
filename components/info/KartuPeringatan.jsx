'use client';

import { AlertTriangle } from 'lucide-react';
import { useWilayah } from '@/lib/hooks/info/useWilayah';
import { usePeringatan } from '@/lib/hooks/info/useBmkgCards';
import { susunPesan } from '@/lib/info/format';
import KartuInfo from './KartuInfo';

export default function KartuPeringatan() {
  const { wilayah } = useWilayah();
  const d = usePeringatan();

  const p = d.items[0];
  const adaItem = d.status === 'ada' && d.items.length > 0;
  const judul = adaItem && p?.judul ? p.judul : d.status === 'aman' ? 'Tidak ada peringatan dini' : 'Peringatan dini';
  const pesan = susunPesan({
    judul,
    wilayah: wilayah?.nama,
    ringkasan: d.ringkasan,
    baris: adaItem && p ? [`Berlaku ${p.berlaku} sampai ${p.berakhir}`] : [],
    diambil: d.diambil,
  });

  return (
    <KartuInfo
      status={d.status}
      judul={judul}
      lencana={d.status === 'ada' ? 'Ada peringatan' : undefined}
      ikon={<AlertTriangle className="h-10 w-10 text-amber-600" />}
      ringkasan={d.ringkasan}
      diambil={d.diambil}
      pesan={pesan}
      detail={
        adaItem ? (
          <ul className="space-y-2">
            {d.items.map((x, i) => (
              <li key={i} className="rounded-xl bg-white/70 p-3 text-xs">
                <p className="text-sm font-black text-foreground">{x.judul}</p>
                <p className="mt-1 text-muted-foreground">
                  Mulai <span className="font-semibold text-foreground">{x.berlaku}</span>, sampai{' '}
                  <span className="font-semibold text-foreground">{x.berakhir}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : null
      }
    />
  );
}