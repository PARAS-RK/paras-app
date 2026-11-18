// Mengubah baris bmkg_cache -> bentuk yang dipakai kartu.
import { fmtWaktu, fmtJam } from './format';

const JAM = 3600 * 1000;

const tidakPasti = (nama, row) => ({
  status: 'tidak_pasti',
  ringkasan: `Informasi ${nama} belum bisa dipastikan saat ini. Silakan cek langsung di bmkg.go.id atau aplikasi InfoBMKG.`,
  diambil: row ? fmtWaktu(row.fetched_at) : null,
  items: [],
});

const basi = (row, now) => new Date(row.expired_at).getTime() < now;

const dasar = (row) => ({
  status: row.status,
  ringkasan: row.summary_text ?? '',
  diambil: fmtWaktu(row.fetched_at),
});

export function adaptCuaca(row, now) {
  const kosong = (r) => ({ ...tidakPasti('prakiraan cuaca', r), slots: [] });
  if (!row || row.status === 'tidak_pasti') return kosong(row);

  const semua = (row.payload?.slots ?? [])
    .map((s) => ({ ...s, t: new Date(`${s.waktu.replace(' ', 'T')}+07:00`) }))
    .filter((s) => !Number.isNaN(s.t.getTime()));

  // slot yang sedang berlaku = slot terakhir yang waktunya <= sekarang
  let mulai = 0;
  semua.forEach((s, i) => { if (s.t.getTime() <= now) mulai = i; });
  const tampil = semua.slice(mulai, mulai + 5);
  if (!tampil.length || now - tampil[0].t.getTime() > 4 * JAM) return kosong(row);

  const kini = tampil[0];
  return {
    ...dasar(row),
    slots: tampil.map((s, i) => ({
      jam: i === 0 ? 'Sekarang' : fmtJam(s.t),
      kondisi: s.kondisi, suhu: s.suhu, ikon: s.ikon,
    })),
    kondisi: kini.kondisi,
    suhu: kini.suhu,
    kelembapan: kini.kelembapan,
    ikon: kini.ikon,
    // cuaca masih berguna walau telat diperbarui: tampilkan dengan catatan
    catatan: basi(row, now)
      ? 'Pembaruan terbaru belum berhasil. Ini data terakhir yang berhasil diambil, kondisi sebenarnya bisa sedikit berbeda.'
      : null,
  };
}

export function adaptPeringatan(row, now) {
  if (!row || basi(row, now)) return tidakPasti('peringatan dini', row);
  return {
    ...dasar(row),
    items: (row.payload?.items ?? []).map((p) => ({
      judul: p.judul,
      berlaku: fmtWaktu(p.berlaku) ?? '-',
      berakhir: fmtWaktu(p.berakhir) ?? '-',
    })),
  };
}

export function adaptGempaRasa(row, now) {
  if (!row || basi(row, now)) return tidakPasti('gempa yang dirasakan', row);
  return { ...dasar(row), items: row.payload?.items ?? [] };
}

export function adaptGempaBesar(row, now) {
  if (!row || basi(row, now)) return { ...tidakPasti('gempa besar', row), jumlah: 0 };
  const items = row.payload?.items ?? [];
  return {
    ...dasar(row),
    items,
    jumlah: row.payload?.jumlah ?? items.length,
    lencana: row.status === 'ada' ? 'Terasa di wilayah Anda' : undefined,
  };
}