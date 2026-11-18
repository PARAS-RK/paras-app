'use client';
import { useMemo } from 'react';
import { useBmkg } from './useBmkg';
import { URUTAN } from '@/lib/info/status';
import { adaptCuaca, adaptPeringatan, adaptGempaRasa, adaptGempaBesar } from '@/lib/info/adapter';

function useKartu(tipe, adapt) {
    const { rows, now } = useBmkg();
    return useMemo(() => adapt(rows[tipe], now), [rows, tipe, adapt, now]);
}

export const useCuaca = () => useKartu('cuaca', adaptCuaca);
export const usePeringatan = () => useKartu('peringatan', adaptPeringatan);
export const useGempaRasa = () => useKartu('gempa_rasa', adaptGempaRasa);
export const useGempaBesar = () => useKartu('gempa_besar', adaptGempaBesar);

/** Slot prakiraan untuk strip jam-jaman. */
export const usePrakiraan = () => useCuaca().slots;

/** Urutan id kartu: yang perlu perhatian di atas. */
export function useUrutanKartu() {
  const cuaca = useCuaca().status;
  const peringatan = usePeringatan().status;
  const gempaRasa = useGempaRasa().status;
  const gempaBesar = useGempaBesar().status;

  return useMemo(
    () =>
      [
        { id: 'cuaca', status: cuaca },
        { id: 'peringatan', status: peringatan },
        { id: 'gempaRasa', status: gempaRasa },
        { id: 'gempaBesar', status: gempaBesar },
      ]
        .sort((a, b) => (URUTAN[a.status] ?? 2) - (URUTAN[b.status] ?? 2))
        .map((k) => k.id),
    [cuaca, peringatan, gempaRasa, gempaBesar]
  );
}