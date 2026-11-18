'use client';
import { useContext } from 'react';
import { BmkgContext } from '@/context/info/BmkgProvider';

export function useBmkg() {
  const ctx = useContext(BmkgContext);
  if (!ctx) throw new Error('useBmkg harus dipakai di dalam <BmkgProvider>');
  return ctx;
}