/** Satu panggilan untuk semua data BMKG. Hasil: { cuaca: Row, peringatan: Row, ... } (yang kosong tidak ada). */
export async function ambilDataBmkg() {
  const res = await fetch('/api/bmkg', {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000), // jangan menggantung selamanya
  });
  if (!res.ok) throw new Error(`/api/bmkg -> ${res.status}`);
  const { data } = await res.json();
  return data ?? {};
}