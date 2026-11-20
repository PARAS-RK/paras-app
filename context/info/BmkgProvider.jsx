'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ambilDataBmkg } from '@/lib/api/bmkgCache';

export const BmkgContext = createContext(null);

const REFRESH_MS = 5 * 60 * 1000;
const TICK_MS = 60 * 1000;

/** State data BMKG: rows, status ('loading' | 'ready' | 'error'), dan now (waktu acuan kartu). */
export function BmkgProvider({ children }) {
  const [rows, setRows] = useState({});
  const [status, setStatus] = useState('loading');
  const [now, setNow] = useState(0);
  const [versi, setVersi] = useState(0); // dinaikkan untuk memaksa muat ulang manual

  useEffect(() => {
    let batal = false;

    const muat = () =>
      ambilDataBmkg()
        .then((hasil) => {
          if (batal) return;
          setRows(hasil);
          setNow(Date.now());
          setStatus('ready');
        })
        .catch((err) => {
          if (batal) return;
          console.error('Gagal memuat data BMKG:', err);
          setStatus((s) => (s === 'ready' ? 'ready' : 'error')); // data lama tetap dipakai
        });

    const saatAktif = () => {
      if (document.visibilityState === 'visible') muat();
    };

    muat();
    const idMuat = setInterval(muat, REFRESH_MS);
    const idTick = setInterval(() => setNow(Date.now()), TICK_MS); // cek basi tiap menit
    document.addEventListener('visibilitychange', saatAktif);

    return () => {
      batal = true;
      clearInterval(idMuat);
      clearInterval(idTick);
      document.removeEventListener('visibilitychange', saatAktif);
    };
  }, [versi]);

  const muatUlang = useCallback(() => setVersi((v) => v + 1), []);

  const value = useMemo(
    () => ({ rows, status, now, muat: muatUlang }),
    [rows, status, now, muatUlang]
  );
  return <BmkgContext.Provider value={value}>{children}</BmkgContext.Provider>;
}