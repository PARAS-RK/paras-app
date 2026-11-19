'use client';

import { Activity } from 'lucide-react';
import { useWilayah } from '@/lib/hooks/info/useWilayah';
import { useGempaRasa } from '@/lib/hooks/info/useBmkgCards';
import { berpotensiTsunami, susunPesan } from '@/lib/info/format';
import KartuInfo from './KartuInfo';
import DaftarGempa from './DaftarGempa';

export default function KartuGempaRasa() {
  const { wilayah } = useWilayah();
  const d = useGempaRasa();

  const g = d.items[0];
  const adaGempa = d.status === 'ada' && g;
  const judul = adaGempa
    ? `Gempa ${g.magnitudo}, terasa di wilayah Anda`
    : d.status === 'aman' ? 'Tidak ada gempa terasa' : 'Gempa dirasakan';
  const baris = adaGempa
    ? d.items.flatMap((x) => [
        `Kekuatan ${x.magnitudo}, ${x.sumber}, kedalaman ${x.kedalaman} (${x.waktu})`,
        berpotensiTsunami(x.potensi) ? x.potensi : null,
      ])
    : [];
  const pesan = susunPesan({ judul, wilayah: wilayah?.nama, ringkasan: d.ringkasan, baris, diambil: d.diambil });

  return (
    <KartuInfo
      status={d.status}
      judul={judul}
      lencana={d.status === 'ada' ? 'Terasa di wilayah Anda' : undefined}
      ikon={<Activity className="h-10 w-10 text-amber-600" />}
      ringkasan={d.ringkasan}
      diambil={d.diambil}
      pesan={pesan}
      ekstra={adaGempa ? <span className="text-xs text-muted-foreground">{g.sumber}, kedalaman {g.kedalaman}</span> : null}
      detail={adaGempa ? <DaftarGempa items={d.items} /> : null}
    />
  );
}