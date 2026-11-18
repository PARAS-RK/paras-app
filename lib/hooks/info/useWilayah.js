'use client';
import { useContext } from 'react';
import { WilayahContext } from '@/context/info/WilayahProvider';

export function useWilayah() {
  const ctx = useContext(WilayahContext);
  if (!ctx) throw new Error('useWilayah harus dipakai di dalam <WilayahProvider>');
  return ctx;
}