'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Award, ChevronRight, CloudRain, CloudLightning, FileText, Leaf, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { useReportContext } from '../../../context/ReportContext';
import { createClient } from '../../../lib/supabase/client';

import { Card, CardContent } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';

export default function Home() {
  const router = useRouter();
  const { reports } = useReportContext();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    displayName: 'Warga PARAS',
    areaFull: 'Atur lokasi domisili',
  });
  const [homeStats, setHomeStats] = useState({
    points: 0,
    streak: 0,
    completedCount: 0,
    activeAction: null,
  });

  // Fetch profil asli dan data statistik dari Supabase saat load awal
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 1. Ambil data profil & regions
        const { data: dataProfile, error } = await supabase
          .from('profiles')
          .select('*, regions(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dataProfile && !error) {
          const kelurahan = dataProfile.regions?.subdistrict || '';
          const kecamatan = dataProfile.regions?.district || '';
          const city = dataProfile.regions?.city || '';
          
          const formattedArea = kelurahan 
            ? `${kelurahan}, ${kecamatan}, ${city}` 
            : 'Atur lokasi domisili';

          setProfileData({
            displayName: dataProfile.full_name || user.user_metadata?.full_name || 'Warga PARAS',
            areaFull: formattedArea,
          });
        } else {
          setProfileData({
            displayName: user.user_metadata?.full_name || 'Warga PARAS',
            areaFull: 'Atur lokasi domisili',
          });
        }

        // 2. Ambil data partisipasi aksi user dari Supabase
        const { data: partRecords } = await supabase
          .from('action_participants')
          .select('*, community_actions(*)')
          .eq('user_id', user.id);

        let completedCount = 0;
        let userPoints = 0;
        let userStreak = 0;
        let ongoingAction = null;

        if (partRecords && partRecords.length > 0) {
          completedCount = partRecords.length;
          userPoints = completedCount * 30; // 30 poin per aksi
          userStreak = 1;

          // Ambil aksi pertama yang sedang diikuti sebagai "Aksi Saya"
          const firstPart = partRecords[0];
          if (firstPart && firstPart.community_actions) {
            // Menghitung progress secara dinamis berdasarkan status penyelesaian
            const status = String(firstPart.completion_action_status || '').trim().toLowerCase();
            const progressVal = status === 'selesai' || status === 'done' ? 100 : 50;

            ongoingAction = {
              id: firstPart.community_actions.action_id,
              title: firstPart.community_actions.action_title,
              achieved: progressVal, 
              target: 100,
            };
          }
        }

        // Sinkronkan dengan kolom points/streak di profiles jika ada
        if (dataProfile) {
          if (dataProfile.points > userPoints) userPoints = dataProfile.points;
          if (dataProfile.streak > userStreak) userStreak = dataProfile.streak;
        }

        setHomeStats({
          points: userPoints,
          streak: userStreak,
          completedCount: completedCount,
          activeAction: ongoingAction,
        });

      } catch (err) {
        console.error('Gagal memuat data beranda:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [router]);

  // Hitung laporan milik user yang sedang diproses
  const mine = reports.filter((r) => r.reporter === profileData.displayName);
  const inProgressReports = mine.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;

  const current = homeStats.activeAction;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  const tiles = [
    current
      ? {
          to: `/aksi/${current.id}`,
          icon: Leaf,
          tone: 'text-[#159038] bg-[#159038]/10',
          label: 'Aksi Saya',
          value: `${pct(current.achieved, current.target)}%`,
          sub: current.title,
          bar: pct(current.achieved, current.target),
          barColor: 'bg-[#159038]',
        }
      : {
          to: '/aksi',
          icon: Leaf,
          tone: 'text-[#159038] bg-[#159038]/10',
          label: 'Aksi Komunitas',
          value: `${homeStats.completedCount}`,
          sub: 'Aksi selesai diikuti',
        },
    {
      to: '/reports',
      icon: FileText,
      tone: 'text-[#E6008A] bg-[#E6008A]/10',
      label: 'Laporan Saya',
      value: `${mine.length}`,
      sub: `${inProgressReports} sedang diproses`,
    },
    {
      to: '/aksi?seg=peringkat',
      icon: Award,
      tone: 'text-amber-600 bg-amber-100',
      label: 'Poin Saya',
      value: `${homeStats.points}`,
      sub: `${homeStats.streak} minggu beruntun`,
    },
    {
      to: '/info',
      icon: CloudRain,
      tone: 'text-sky-600 bg-sky-100',
      label: 'Info Cuaca',
      value: '26°C',
      sub: 'Hujan Ringan',
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
        {/* Banner Cuaca (Peringatan Dini) */}
        <Link href="/info" className="block group">
          <Card className="border-orange-200 bg-orange-50/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:bg-orange-100/80">
            <CardContent className="flex items-center gap-4 p-4 lg:p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-200 text-orange-700">
                <AlertTriangle className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-orange-950">Potensi hujan lebat, 15.00–16.00</p>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-orange-800">
                  <CloudLightning className="h-4 w-4" aria-hidden />
                  <span>Hujan disertai petir</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-orange-400 transition-transform group-hover:translate-x-1" aria-hidden />
            </CardContent>
          </Card>
        </Link>

        {/* Tombol Aksi Utama (Buat Laporan) - Magenta Pink */}
        <Link href="/chatbot" className="block group">
          <Card className="border-none bg-[#E6008A] text-white shadow-lg shadow-pink-500/20 transition-transform hover:-translate-y-0.5">
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
          {tiles.map((t) => (
            <Link key={t.label} href={t.to} className="block group h-full">
              <Card className="h-full transition-all hover:shadow-md border-gray-200/60 hover:border-gray-300">
                <CardContent className="flex flex-col p-5">
                  <div className="flex items-center justify-between">
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
          ))}
        </nav>
      </div>
    </div>
  );
}