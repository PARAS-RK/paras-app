'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { WilayahProvider } from '@/context/info/WilayahProvider';
import { BmkgProvider } from '@/context/info/BmkgProvider';
import { useWilayah } from '@/lib/hooks/info/useWilayah';
import { useBmkg } from '@/lib/hooks/info/useBmkg';
import { useUrutanKartu } from '@/lib/hooks/info/useBmkgCards';
import StripPrakiraan from '@/components/info/StripPrakiraan';
import KartuCuaca from '@/components/info/KartuCuaca';
import KartuPeringatan from '@/components/info/KartuPeringatan';
import KartuGempaRasa from '@/components/info/KartuGempaRasa';
import KartuGempaBesar from '@/components/info/KartuGempaBesar';

const KARTU = {
  cuaca: KartuCuaca,
  peringatan: KartuPeringatan,
  gempaRasa: KartuGempaRasa,
  gempaBesar: KartuGempaBesar,
};

function Memuat() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  );
}

function Pesan({ children }) {
  return (
    <div className="mx-auto flex h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center text-sm text-foreground">
      {children}
    </div>
  );
}

function Isi() {
  const { status: statusWilayah, wilayah } = useWilayah();
  const { status: statusData } = useBmkg();
  const urutan = useUrutanKartu();

  if (statusWilayah === 'loading' || (statusWilayah === 'siap' && statusData === 'loading')) return <Memuat />;

  if (statusWilayah === 'tanpa_wilayah') {
    return (
      <Pesan>
        <p>Wilayah Anda belum diatur, jadi info cuaca dan bencana belum bisa ditampilkan.</p>
        <Link href="/profile" className="font-bold underline">Atur wilayah</Link>
      </Pesan>
    );
  }
  if (statusWilayah === 'error') {
    return <Pesan><p>Gagal memuat data wilayah. Coba muat ulang halaman.</p></Pesan>;
  }

  return (
    <div className="flex flex-col">
      <header className="border-b border-border bg-white px-4 pb-4 pt-5 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-black text-foreground">Info Cuaca dan Bencana</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sumber:{' '}
            <a
              href="https://data.bmkg.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-foreground"
            >
              BMKG
            </a>
            . Ringkasan diperbarui otomatis.
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">📍 {wilayah.nama}</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 lg:px-10">
        <StripPrakiraan />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-start gap-4">
          {urutan.map((id) => {
            const Kartu = KARTU[id];
            return <Kartu key={id} />;
          })}
        </div>
      </main>
    </div>
  );
}

export default function InfoCuacaContent() {
  return (
    <WilayahProvider>
      <BmkgProvider>
        <Isi />
      </BmkgProvider>
    </WilayahProvider>
  );
}