"use client";

import Link from "next/link";

import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, Check, ChevronDown, ChevronUp, Clock, Cloud, CloudFog,
  CloudLightning, CloudRain, CloudSun, Copy, Droplets, Globe, Info, ShieldCheck, Sun,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

/*
  Halaman ini HANYA menampilkan data yang diberikan lewat prop `data`.
  Tidak ada pengambilan data, penyaringan wilayah, atau refresh di dalamnya.

  status tiap kartu:
    'normal'      kartu biasa (cuaca, gempa besar yang tidak terasa)
    'ada'         ada kejadian (peringatan aktif, gempa terasa)
    'aman'        data segar dan memang tidak ada kejadian
    'tidak_pasti' data tidak bisa dipastikan (jangan tampilkan "aman")
*/

// ---------- DATA CONTOH (ganti dengan data asli) ----------
const dataContoh = {
  wilayah: 'Kebayoran Baru, Jakarta Selatan',

  // Strip prakiraan per 3 jam. Slot pertama = slot yang sedang berlaku (berlabel "Sekarang")
  prakiraan: [
    { jam: 'Sekarang', kondisi: 'Hujan Ringan', suhu: 26, ikon: null },
    { jam: '16.00', kondisi: 'Hujan Ringan', suhu: 25, ikon: null },
    { jam: '19.00', kondisi: 'Berawan', suhu: 24, ikon: null },
    { jam: '22.00', kondisi: 'Berawan', suhu: 23, ikon: null },
  ],

  cuaca: {
    status: 'normal',
    ringkasan:
      'Hari ini di Kebayoran Baru diperkirakan hujan ringan dari siang sampai sore, dengan suhu sekitar 22-28°C. Siapkan payung atau jas hujan sebelum bepergian ya ☔',
    kondisi: 'Hujan Ringan',
    suhu: 26,
    kelembapan: 85,
    ikon: null, // isi dengan URL ikon dari BMKG (field `image`); kosong = ikon bawaan
    diambil: '31-10-2026 14:32 WIB',
    catatan: null, // mis. 'Ini data terakhir yang berhasil diambil (4 jam lalu).'
  },

  peringatan: {
    status: 'ada',
    ringkasan:
      'Hati-hati, diperkirakan terjadi hujan lebat disertai petir di Kebayoran Baru sampai pukul 16.00 WIB. Sebaiknya tunda dulu kegiatan di luar rumah ya ⚠️',
    diambil: '31-10-2026 14:33 WIB',
    items: [
      {
        judul: 'Hujan Lebat disertai Petir',
        berlaku: '31-10-2026 15:00 WIB',
        berakhir: '31-10-2026 16:00 WIB',
        wilayah: 'Kecamatan Kebayoran Baru',
      },
    ],
  },

  gempaRasa: {
    status: 'ada',
    ringkasan:
      'Pagi tadi ada gempa berkekuatan 5.2 yang terasa di wilayah Anda. Tetap tenang, lalu periksa apakah ada bagian rumah yang retak 🙏',
    diambil: '31-10-2026 14:30 WIB',
    items: [
      {
        magnitudo: '5.2',
        sumber: 'Banten',
        kedalaman: '10 km',
        potensi: 'Tidak berpotensi tsunami',
        waktu: '31-10-2026 06:15 WIB',
      },
    ],
  },

  gempaBesar: {
    status: 'normal',
    lencana: undefined, // mis. 'Terasa di wilayah Anda'
    ringkasan:
      'Dalam 7 hari terakhir ada 3 gempa besar di Indonesia, yang terkuat berkekuatan 5.8 di Maluku Utara. Tidak ada yang terasa di wilayah Anda, tapi tetap hati-hati dan pantau informasi resmi BMKG 🙏',
    diambil: '31-10-2026 14:30 WIB',
    items: [
      { magnitudo: '5.8', sumber: 'Maluku Utara', kedalaman: '35 km', potensi: 'Tidak berpotensi tsunami', waktu: '28-10-2026 21:40 WIB' },
      { magnitudo: '5.3', sumber: 'Laut Banda', kedalaman: '120 km', potensi: 'Tidak berpotensi tsunami', waktu: '26-10-2026 03:12 WIB' },
      { magnitudo: '5.1', sumber: 'Sumatera Barat', kedalaman: '20 km', potensi: 'Tidak berpotensi tsunami', waktu: '25-10-2026 17:05 WIB' },
    ],
  },
};

// ---------- GAYA PER STATUS ----------
const STATUS = {
  normal: { kartu: 'border-border bg-white', lencana: null },
  ada: {
    kartu: 'border-amber-200 bg-amber-50',
    lencana: { teks: 'Perlu perhatian', kelas: 'bg-amber-400 text-slate-900' },
  },
  aman: {
    kartu: 'border-brand-xlight bg-brand-light',
    lencana: { teks: 'Aman', kelas: 'bg-brand text-white' },
  },
  tidak_pasti: {
    kartu: 'border-border bg-muted',
    lencana: { teks: 'Belum bisa dipastikan', kelas: 'bg-slate-600 text-white' },
  },
};

// Kartu yang ada kejadian tampil paling atas
const URUTAN = { ada: 0, tidak_pasti: 1, normal: 2, aman: 3 };

// ---------- FUNGSI BANTU TAMPILAN ----------
// Potensi tsunami baru ikut ditulis di pesan kalau memang berpotensi
const berpotensiTsunami = (p) => Boolean(p) && !/tidak/i.test(p);

// Susun pesan yang dibagikan: judul tebal, ringkasan, detail singkat, waktu, sumber
function susunPesan({ judul, wilayah, ringkasan, baris = [], diambil }) {
  const kepala = wilayah ? `*${judul}, ${wilayah}*` : `*${judul}*`;
  const akhir = [...baris.filter(Boolean), `${diambil ? `Per ${diambil}. ` : ''}Sumber: BMKG`].join('\n');
  return [kepala, ringkasan, akhir].filter(Boolean).join('\n\n');
}

async function salinTeks(teks) {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    try {
      // cadangan untuk pratinjau/iframe yang memblokir clipboard
      const ta = document.createElement('textarea');
      ta.value = teks;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// ---------- KOMPONEN KECIL ----------
function LogoWA({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.524 5.856L.057 23.882l6.197-1.625A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.213-3.677.964.981-3.582-.234-.368A9.78 9.78 0 012.182 12C2.182 6.59 6.59 2.182 12 2.182S21.818 6.59 21.818 12 17.41 21.818 12 21.818z" />
    </svg>
  );
}

function IkonCuaca({ url, kondisi, ukuran = 'h-10 w-10' }) {
  const [gagal, setGagal] = useState(false);
  if (url && !gagal) {
    return (
      <img
        src={url}
        alt={kondisi || 'Ikon cuaca'}
        className={cn(ukuran, 'object-contain')}
        onError={() => setGagal(true)}
      />
    );
  }
  const k = (kondisi || '').toLowerCase();
  let Ikon = Sun;
  if (k.includes('petir')) Ikon = CloudLightning;
  else if (k.includes('hujan')) Ikon = CloudRain;
  else if (k.includes('kabut') || k.includes('kabur') || k.includes('asap')) Ikon = CloudFog;
  else if (k.includes('cerah berawan')) Ikon = CloudSun;
  else if (k.includes('berawan')) Ikon = Cloud;
  return <Ikon className={cn(ukuran, 'text-brand')} aria-hidden />;
}

function DaftarGempa({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((g, i) => (
        <li key={i} className="rounded-xl bg-white/70 p-3 text-xs">
          <p className="text-sm font-black text-foreground">
            Kekuatan {g.magnitudo}, {g.sumber}
          </p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {[
              ['Waktu', g.waktu],
              ['Kedalaman', g.kedalaman],
              ['Potensi tsunami', g.potensi],
            ].map(([label, nilai]) => (
              <Fragment key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold text-foreground">{nilai}</dd>
              </Fragment>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

// ---------- STRIP PRAKIRAAN (kartu mini, bisa digeser di HP) ----------
function StripPrakiraan({ slots }) {
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

// ---------- KARTU DASAR ----------
function KartuInfo({ status = 'normal', judul, lencana, ikon, ringkasan, ekstra, catatan, detail, diambil, pesan }) {
  const [buka, setBuka] = useState(false);
  const [bagikanBuka, setBagikanBuka] = useState(false);
  const [salinStatus, setSalinStatus] = useState('siap'); // 'siap' | 'tersalin' | 'gagal'
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const gaya = STATUS[status] ?? STATUS.normal;
  const teksLencana = lencana ?? gaya.lencana?.teks;
  const kelasLencana = gaya.lencana?.kelas ?? 'bg-slate-600 text-white';

  // Kartu "ada" dan "belum pasti" memuat saran penting, jadi ringkasannya tidak dipotong
  const potong = status === 'normal' || status === 'aman';
  const adaTombolBuka = Boolean(detail) || potong;
  const bisaBagikan = Boolean(pesan) && status !== 'tidak_pasti';

  let ikonTampil = ikon;
  if (status === 'aman') ikonTampil = <ShieldCheck className="h-10 w-10 text-brand" aria-hidden />;
  if (status === 'tidak_pasti') ikonTampil = <Info className="h-10 w-10 text-slate-500" aria-hidden />;

  async function salin() {
    const ok = await salinTeks(pesan);
    clearTimeout(timer.current);
    setSalinStatus(ok ? 'tersalin' : 'gagal');
    if (ok) timer.current = setTimeout(() => setSalinStatus('siap'), 3000);
  }

  return (
    <article className={cn('flex flex-col rounded-2xl border p-4 sm:p-5', gaya.kartu)}>
      {/* Ikon besar + judul pendek */}
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

      {/* Ringkasan tampil tanpa label */}
      <p
        className={cn(
          'mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground',
          potong && !buka && 'line-clamp-3'
        )}
      >
        {ringkasan}
      </p>

      {ekstra && <div className="mt-2 flex flex-wrap items-center gap-2">{ekstra}</div>}
      {catatan && <p className="mt-2 text-xs text-muted-foreground">{catatan}</p>}

      {detail && buka && <div className="mt-3">{detail}</div>}

      {/* Pratinjau pesan + kirim WhatsApp / salin */}
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
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#128C7E] px-3 text-sm font-bold text-white hover:bg-[#0f7a6e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]"
            >
              <LogoWA className="h-4 w-4" /> Kirim lewat WhatsApp
            </a>
            <button
              type="button"
              onClick={salin}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                salinStatus === 'tersalin'
                  ? 'border-slate-300 bg-slate-200 text-slate-700'
                  : 'border-border bg-white text-foreground hover:bg-muted'
              )}
            >
              {salinStatus === 'tersalin' ? (
                <><Check className="h-4 w-4" aria-hidden /> Tersalin</>
              ) : (
                <><Copy className="h-4 w-4" aria-hidden /> Salin</>
              )}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">{salinStatus === 'tersalin' ? 'Pesan tersalin' : ''}</p>
          {salinStatus === 'gagal' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Salin otomatis tidak didukung di sini. Blok teks di atas lalu salin secara manual.
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {bisaBagikan && (
            <button
              type="button"
              onClick={() => setBagikanBuka(!bagikanBuka)}
              aria-expanded={bagikanBuka}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-bold text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <LogoWA className="h-4 w-4 text-[#25D366]" /> Bagikan
            </button>
          )}
          {adaTombolBuka && (
            <button
              type="button"
              onClick={() => setBuka(!buka)}
              aria-expanded={buka}
              className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {buka ? (
                <>Sembunyikan <ChevronUp className="h-4 w-4" aria-hidden /></>
              ) : (
                <>Selengkapnya <ChevronDown className="h-4 w-4" aria-hidden /></>
              )}
            </button>
          )}
        </div>
        {diambil && (
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden /> Diambil {diambil}
          </p>
        )}
      </div>
    </article>
  );
}

// ---------- KARTU PER TOPIK ----------
function KartuCuaca({ d, wilayah }) {
  const tampilKondisi = d.status !== 'tidak_pasti' && d.kondisi;
  const pesan = susunPesan({
    judul: 'Cuaca hari ini',
    wilayah,
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
            <Droplets className="h-3 w-3" aria-hidden /> Kelembapan {d.kelembapan}%
          </span>
        ) : null
      }
    />
  );
}

function KartuPeringatan({ d, wilayah }) {
  const p = d.items?.[0];
  const adaItem = d.status === 'ada' && d.items?.length > 0;
  const judul =
    adaItem && p?.judul ? p.judul : d.status === 'aman' ? 'Tidak ada peringatan dini' : 'Peringatan dini';
  const pesan = susunPesan({
    judul,
    wilayah,
    ringkasan: d.ringkasan,
    baris: adaItem && p ? [`Berlaku ${p.berlaku} sampai ${p.berakhir}`] : [],
    diambil: d.diambil,
  });
  return (
    <KartuInfo
      status={d.status}
      judul={judul}
      lencana={d.status === 'ada' ? 'Ada peringatan' : undefined}
      ikon={<AlertTriangle className="h-10 w-10 text-amber-600" aria-hidden />}
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
                {x.wilayah && (
                  <p className="mt-0.5 text-muted-foreground">
                    Wilayah <span className="font-semibold text-foreground">{x.wilayah}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : null
      }
    />
  );
}

function KartuGempaRasa({ d, wilayah }) {
  const g = d.items?.[0]; // gempa terkuat/terbaru, urutan ditentukan data
  const adaGempa = d.status === 'ada' && g;
  const judul = adaGempa
    ? `Gempa ${g.magnitudo}, terasa di wilayah Anda`
    : d.status === 'aman'
      ? 'Tidak ada gempa terasa'
      : 'Gempa dirasakan';
  const baris = adaGempa
    ? d.items.flatMap((x) => [
        `Kekuatan ${x.magnitudo}, ${x.sumber}, kedalaman ${x.kedalaman} (${x.waktu})`,
        berpotensiTsunami(x.potensi) ? x.potensi : null,
      ])
    : [];
  const pesan = susunPesan({ judul, wilayah, ringkasan: d.ringkasan, baris, diambil: d.diambil });
  return (
    <KartuInfo
      status={d.status}
      judul={judul}
      lencana={d.status === 'ada' ? 'Terasa di wilayah Anda' : undefined}
      ikon={<Activity className="h-10 w-10 text-amber-600" aria-hidden />}
      ringkasan={d.ringkasan}
      diambil={d.diambil}
      pesan={pesan}
      ekstra={
        adaGempa ? (
          <span className="text-xs text-muted-foreground">
            {g.sumber}, kedalaman {g.kedalaman}
          </span>
        ) : null
      }
      detail={adaGempa ? <DaftarGempa items={d.items} /> : null}
    />
  );
}

function KartuGempaBesar({ d }) {
  const semua = d.items ?? [];
  const items = semua.slice(0, 3);
  const angka = (m) => parseFloat(String(m).replace(',', '.')) || 0;
  const terkuat = semua.reduce((a, b) => (angka(b.magnitudo) > angka(a.magnitudo) ? b : a), semua[0]);
  const judul =
    d.status === 'tidak_pasti'
      ? 'Gempa besar'
      : semua.length > 0
        ? `${semua.length} gempa besar, terkuat ${terkuat.magnitudo}`
        : 'Tidak ada gempa besar';
  const pesan = susunPesan({
    judul: 'Gempa besar 7 hari terakhir',
    ringkasan: d.ringkasan,
    baris: items.map(
      (g, i) =>
        `${i + 1}. Kekuatan ${g.magnitudo}, ${g.sumber} (${g.waktu}, kedalaman ${g.kedalaman})` +
        (berpotensiTsunami(g.potensi) ? `, ${g.potensi}` : '')
    ),
    diambil: d.diambil,
  });
  return (
    <KartuInfo
      status={d.status}
      judul={judul}
      lencana={d.lencana}
      ikon={<Globe className="h-10 w-10 text-brand" aria-hidden />}
      ringkasan={d.ringkasan}
      diambil={d.diambil}
      pesan={pesan}
      detail={items.length > 0 && d.status !== 'tidak_pasti' ? <DaftarGempa items={items} /> : null}
    />
  );
}

// ---------- HALAMAN ----------
export default function WeatherInfo({ data = dataContoh }) {
  const kartu = [
    { id: 'cuaca', status: data.cuaca.status, el: <KartuCuaca d={data.cuaca} wilayah={data.wilayah} /> },
    { id: 'peringatan', status: data.peringatan.status, el: <KartuPeringatan d={data.peringatan} wilayah={data.wilayah} /> },
    { id: 'gempaRasa', status: data.gempaRasa.status, el: <KartuGempaRasa d={data.gempaRasa} wilayah={data.wilayah} /> },
    { id: 'gempaBesar', status: data.gempaBesar.status, el: <KartuGempaBesar d={data.gempaBesar} /> },
  ].sort((a, b) => (URUTAN[a.status] ?? 2) - (URUTAN[b.status] ?? 2));

  return (
    <div className="flex flex-col">
      <header className="border-b border-border bg-white px-4 pb-4 pt-5 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-black text-foreground">Info Cuaca dan Bencana</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sumber:{' '}
            <a
              href="https://www.bmkg.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-foreground"
            >
              BMKG
            </a>
            . Ringkasan dibuat otomatis.
          </p>
          {data.wilayah && (
            <p className="mt-2 text-sm font-semibold text-foreground">📍 {data.wilayah}</p>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 lg:px-10">
        <StripPrakiraan slots={data.prakiraan} />

        {/* Kartu otomatis menumpuk kalau layar menyempit. Lebar minimum 22rem membuat desktop 2 kolom (susunan 2x2) */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-start gap-4">
          {kartu.map((k) => (
            <Fragment key={k.id}>{k.el}</Fragment>
          ))}
        </div>
      </main>
    </div>
  );
}