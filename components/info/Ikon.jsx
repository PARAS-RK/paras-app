'use client';

import { useState } from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoWA({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.524 5.856L.057 23.882l6.197-1.625A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.213-3.677.964.981-3.582-.234-.368A9.78 9.78 0 012.182 12C2.182 6.59 6.59 2.182 12 2.182S21.818 6.59 21.818 12 17.41 21.818 12 21.818z" />
    </svg>
  );
}

export function IkonCuaca({ url, kondisi, ukuran = 'h-10 w-10' }) {
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