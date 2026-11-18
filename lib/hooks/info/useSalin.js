'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { salinTeks } from '@/lib/info/format';

/** status: 'siap' | 'tersalin' | 'gagal' */
export function useSalin(teks) {
  const [status, setStatus] = useState('siap');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const salin = useCallback(async () => {
    const ok = await salinTeks(teks);
    clearTimeout(timer.current);
    setStatus(ok ? 'tersalin' : 'gagal');
    if (ok) timer.current = setTimeout(() => setStatus('siap'), 3000);
  }, [teks]);

  return { status, salin };
}