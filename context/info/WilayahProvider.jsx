'use client';

import { createContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ambilWilayahUser } from '@/lib/api/wilayah';

export const WilayahContext = createContext(null);

/** State wilayah user saja: 'loading' | 'siap' | 'tanpa_wilayah' | 'error' */
export function WilayahProvider({ children }) {
  const router = useRouter();
  const [state, setState] = useState({ status: 'loading', wilayah: null });

  useEffect(() => {
    let batal = false;
    ambilWilayahUser()
      .then((hasil) => {
        if (batal) return;
        if (hasil.status === 'belum_login') return router.replace('/login');
        setState({ status: hasil.status, wilayah: hasil.wilayah ?? null });
      })
      .catch(() => !batal && setState({ status: 'error', wilayah: null }));
    return () => { batal = true; };
  }, [router]);

  const value = useMemo(() => state, [state]);
  return <WilayahContext.Provider value={value}>{children}</WilayahContext.Provider>;
}