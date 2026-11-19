// data_type di bmkg_cache -> nama endpoint /api/bmkg/<nama>
const ENDPOINT = {
  cuaca: 'cuaca',
  peringatan: 'peringatan',
  gempa_rasa: 'gempaRasa',
  gempa_besar: 'gempaBesar',
};

/** Panggil 4 endpoint paralel. Hasil: { cuaca: Row, peringatan: Row, ... } (yang kosong tidak ada). */
export async function ambilDataBmkg() {
  const hasil = await Promise.allSettled(
    Object.entries(ENDPOINT).map(async ([tipe, path]) => {
      const res = await fetch(`/api/bmkg/${path}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`/api/bmkg/${path} -> ${res.status}`);
      const { data } = await res.json();
      return [tipe, data];
    })
  );

  const rows = {};
  let berhasil = 0;
  for (const h of hasil) {
    if (h.status !== 'fulfilled') continue;
    berhasil += 1;
    const [tipe, data] = h.value;
    if (data) rows[tipe] = data;
  }
  // kalau satu endpoint gagal, kartunya jadi "belum bisa dipastikan"; kalau semuanya gagal baru error
  if (berhasil === 0) throw new Error('Semua endpoint BMKG gagal');
  return rows;
}