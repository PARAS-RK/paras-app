'use client';

import { Globe } from 'lucide-react';
import { useGempaBesar } from '@/lib/hooks/info/useBmkgCards';
import { susunPesan } from '@/lib/info/format';
import KartuInfo from './KartuInfo';
import DaftarGempa from './DaftarGempa';

export default function KartuGempaBesar() {
  const d = useGempaBesar();

  // items dari backend sudah diurutkan: yang terkuat di indeks 0
  const judul =
    d.status === 'tidak_pasti' ? 'Gempa besar'
    : d.jumlah > 0 ? `${d.jumlah} gempa besar, terkuat ${d.items[0]?.magnitudo}`
    : 'Tidak ada gempa besar';

  const pesan = susunPesan({
    judul: 'Gempa besar 7 hari terakhir',
    ringkasan: d.ringkasan,
    baris: d.items.slice(0, 3).map((g, i) => `${i + 1}. Kekuatan ${g.magnitudo}, ${g.sumber} (${g.waktu}, kedalaman ${g.kedalaman})`),
    diambil: d.diambil,
  });

  return (
    <KartuInfo
      status={d.status}
      judul={judul}
      lencana={d.lencana}
      ikon={<Globe className="h-10 w-10 text-brand" />}
      ringkasan={d.ringkasan}
      diambil={d.diambil}
      pesan={pesan}
      detail={d.items.length > 0 && d.status !== 'tidak_pasti' ? <DaftarGempa items={d.items} /> : null}
    />
  );
}