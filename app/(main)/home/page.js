'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Award, ChevronRight, CloudRain, CloudLightning, FileText, Leaf, MapPin, MessageCircle, Loader2 } from 'lucide-react';

import { Card, CardContent } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { useWilayah } from '@/lib/hooks/info/useWilayah';
import { useBmkg } from '@/lib/hooks/info/useBmkg';
import { useCuaca, usePeringatan } from '@/lib/hooks/info/useBmkgCards';
import { IkonCuaca } from '@/components/info/Ikon';

// Warna banner: oranye (desain asli) dipakai saat ada peringatan dini aktif
const NADA = {
  ada: {
    kartu: 'border-orange-200 bg-orange-50/80 hover:bg-orange-100/80',
    ikon: 'bg-orange-200 text-orange-700',
    judul: 'text-orange-950',
    sub: 'text-orange-800',
    panah: 'text-orange-400',
  },
  aman: {
    kartu: 'border-sky-200 bg-sky-50/80 hover:bg-sky-100/80',
    ikon: 'bg-sky-200 text-sky-700',
    judul: 'text-sky-950',
    sub: 'text-sky-800',
    panah: 'text-sky-400',
  },
  tidak_pasti: {
    kartu: 'border-slate-200 bg-slate-50/80 hover:bg-slate-100/80',
    ikon: 'bg-slate-200 text-slate-700',
    judul: 'text-slate-950',
    sub: 'text-slate-700',
    panah: 'text-slate-400',
  },
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Data BMKG (provider ada di app/(main)/layout.js)
  const { status: statusWilayah } = useWilayah();
  const { status: statusBmkg } = useBmkg();
  const peringatan = usePeringatan();
  const cuaca = useCuaca();

  // Ambil profil dan statistik aktivitas dari /api/home
  useEffect(() => {
    const controller = new AbortController();

    const fetchHomeData = async () => {
      try {
        const res = await fetch('/api/home', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        setData(await res.json());
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Gagal memuat data beranda:', err);
          setData(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchHomeData();
    return () => controller.abort();
  }, [router]);

  const profileData = {
    displayName: data?.displayName ?? 'Warga PARAS',
    areaFull: data?.areaFull || 'Wilayah belum diatur',
  };

  const s = data?.stats ?? {
    points: 0,
    completedCount: 0,
    activeAction: null,
    reportsTotal: 0,
    reportsInProgress: 0,
  };

  const current = s.activeAction;
  const pct = (a, b) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);

  // ---- Data BMKG untuk banner dan tile cuaca ----
  const tanpaWilayah = statusWilayah === 'tanpa_wilayah' || statusWilayah === 'error';
  const bmkgMemuat = statusWilayah === 'loading' || (statusWilayah === 'siap' && statusBmkg === 'loading');

  const adaPeringatan =
    !bmkgMemuat && !tanpaWilayah && peringatan.status === 'ada' && peringatan.items.length > 0;
  const peringatanTidakPasti =
    tanpaWilayah || (!bmkgMemuat && peringatan.status === 'tidak_pasti');
  const nada = NADA[adaPeringatan ? 'ada' : peringatanTidakPasti ? 'tidak_pasti' : 'aman'];

  let judulPeringatan = 'Tidak ada peringatan dini cuaca';
  let subPeringatan = 'Pantau informasi cuaca dan bencana BMKG';
  if (bmkgMemuat) {
    judulPeringatan = 'Memuat info peringatan dini...';
  } else if (tanpaWilayah) {
    judulPeringatan = 'Wilayah belum diatur';
    subPeringatan = 'Atur wilayah untuk melihat info cuaca dan bencana';
  } else if (adaPeringatan) {
    judulPeringatan = peringatan.items[0].judul;
    subPeringatan = `Berlaku sampai ${peringatan.items[0].berakhir}`;
  } else if (peringatanTidakPasti) {
    judulPeringatan = 'Peringatan dini belum bisa dipastikan';
    subPeringatan = 'Cek langsung di bmkg.go.id';
  }

  const cuacaAda = !bmkgMemuat && !tanpaWilayah && cuaca.status !== 'tidak_pasti' && cuaca.suhu != null;
  const suhuCuaca = cuacaAda ? `${cuaca.suhu}°C` : '—';
  const kondisiCuaca = bmkgMemuat
    ? 'Memuat...'
    : tanpaWilayah
      ? 'Wilayah belum diatur'
      : cuacaAda
        ? cuaca.kondisi
        : 'Belum bisa dipastikan';

  const tiles = [
    current
      ? {
          to: `/aksi/${current.id}`,
          icon: Leaf,
          tone: 'text-[#159038] bg-[#159038]/10',
          label: 'Aksi Saya',
          value: current.isDone ? 'Selesai' : `${pct(current.achieved, current.target)}%`,
          sub: current.title,
          bar: pct(current.achieved, current.target),
          barColor: 'bg-[#159038]',
        }
      : {
          to: '/aksi',
          icon: Leaf,
          tone: 'text-[#159038] bg-[#159038]/10',
          label: 'Aksi Komunitas',
          value: `${s.completedCount}`,
          sub: 'Aksi selesai diikuti',
        },
    {
      to: '/lapor',
      icon: FileText,
      tone: 'text-[#E6008A] bg-[#E6008A]/10',
      label: 'Laporan Saya',
      value: `${s.reportsTotal}`,
      sub: `${s.reportsInProgress} sedang diproses`,
    },
    {
      to: '/aksi?seg=peringkat',
      icon: Award,
      tone: 'text-amber-600 bg-amber-100',
      label: 'Poin Saya',
      value: `${s.points}`,
      sub: 'Total poin aksi',
    },
    {
      to: '/info',
      icon: CloudRain, // cadangan saat data belum ada
      ikonNode: cuacaAda ? <IkonCuaca url={cuaca.ikon} kondisi={cuaca.kondisi} ukuran="h-7 w-7" /> : null,
      tone: 'text-sky-600 bg-sky-100',
      label: 'Info Cuaca',
      value: suhuCuaca,
      sub: kondisiCuaca,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#159038]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 font-sans pb-12">
      {/* 1. Header Section (Eco Emerald Green) */}
      <section className="relative overflow-hidden bg-[#159038] px-5 py-10 text-white lg:px-10 lg:py-14">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-xl" />

        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-medium text-white/80">Selamat datang kembali,</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{profileData.displayName}</h1>
          <div className="mt-5 flex items-center gap-2 text-sm text-white/90">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{profileData.areaFull}</span>
          </div>
        </div>
      </section>

      {/* 2. Main Content Container */}
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 lg:space-y-6 lg:px-10 lg:py-8 -mt-6 relative z-10">
        {/* Banner Peringatan Dini BMKG -> Link ke /info */}
        <Link href="/info" className="block group">
          <Card className={`${nada.kartu} backdrop-blur-sm shadow-sm transition-all hover:shadow-md rounded-lg`}>
            <CardContent className="flex items-center gap-4 p-4 lg:p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${nada.ikon}`}>
                <AlertTriangle className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-base font-bold ${nada.judul}`}>{judulPeringatan}</p>
                <div className={`mt-1 flex items-center gap-1.5 text-sm ${nada.sub}`}>
                  <CloudLightning className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{subPeringatan}</span>
                </div>
              </div>
              <ChevronRight
                className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 ${nada.panah}`}
                aria-hidden
              />
            </CardContent>
          </Card>
        </Link>

        {/* Tombol Aksi Utama (Buat Laporan) - Magenta Pink */}
        <Link href="/lapor" className="block group">
          <Card className="border-none bg-[#E6008A] text-white shadow-lg shadow-pink-500/20 transition-transform hover:-translate-y-0.5 rounded-lg">
            <CardContent className="flex items-center gap-4 p-4 lg:p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <MessageCircle className="h-6 w-6 text-white" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">Buat Laporan</p>
                <p className="text-sm text-white/80 mt-0.5">Ada masalah di sekitar Anda?</p>
              </div>
              <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
            </CardContent>
          </Card>
        </Link>

        {/* Grid Ringkasan (Shadcn Cards) */}
        <nav aria-label="Ringkasan Aktivitas" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5 pt-2">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.label} href={t.to} className="block group h-full">
                <Card className="h-full transition-all hover:shadow-md border-gray-200/60 hover:border-gray-300 rounded-lg">
                  <CardContent className="flex flex-col p-5">
                    <div className="flex items-center justify-between">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.tone}`}>
                        {t.ikonNode ?? <Icon className="h-5 w-5" aria-hidden />}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" aria-hidden />
                    </div>

                    <div className="mt-4 flex flex-col gap-1">
                      <p className="text-sm font-semibold text-gray-500">{t.label}</p>
                      <p className="text-3xl font-black tracking-tight text-gray-900">{t.value}</p>
                      <p className="truncate text-xs font-medium text-gray-500 mt-1">{t.sub}</p>
                    </div>

                    {'bar' in t && t.bar !== undefined && (
                      <div className="mt-4">
                        <Progress value={t.bar} className="h-2 bg-gray-100" indicatorClassName={t.barColor} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}