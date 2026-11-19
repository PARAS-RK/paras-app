'use client';

import { Droplets } from 'lucide-react';
import { useWilayah } from '@/lib/hooks/info/useWilayah';
import { useCuaca } from '@/lib/hooks/info/useBmkgCards';
import { susunPesan } from '@/lib/info/format';
import KartuInfo from './KartuInfo';
import { IkonCuaca } from './Ikon';

export default function KartuCuaca() {
  const { wilayah } = useWilayah();
  const d = useCuaca();

  const tampilKondisi = d.status !== 'tidak_pasti' && d.kondisi;
  const pesan = susunPesan({
    judul: 'Cuaca hari ini',
    wilayah: wilayah?.nama,
    ringkasan: d.ringkasan,
    baris: tampilKondisi ? [`Saat ini: ${d.kondisi}${d.suhu != null ? `, ${d.suhu}°C` : ''}`] : [],
    diambil: d.diambil,
  });

  return (
    <KartuInfo
      status={d.status}
      judul="Cuaca hari ini"
      ringkasan={d.ringkasan}
      diambil={d.diambil}
      catatan={d.catatan}
      pesan={pesan}
      ikon={<IkonCuaca url={d.ikon} kondisi={d.kondisi} ukuran="h-11 w-11" />}
      ekstra={
        tampilKondisi && d.kelembapan != null ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Droplets className="h-3 w-3" /> Kelembapan {d.kelembapan}%
          </span>
        ) : null
      }
    />
  );
}