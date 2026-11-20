'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRegionOptions } from '@/lib/actions/regions';

const LEVELS = [
  { key: 'province', codeKey: 'provinceCode', nameKey: 'provinceName', label: 'Provinsi', placeholder: 'Pilih provinsi' },
  { key: 'city', codeKey: 'cityCode', nameKey: 'cityName', label: 'Kota/Kabupaten', placeholder: 'Pilih kota/kabupaten' },
  { key: 'district', codeKey: 'districtCode', nameKey: 'districtName', label: 'Kecamatan', placeholder: 'Pilih kecamatan' },
  { key: 'subdistrict', codeKey: 'subdistrictCode', nameKey: 'subdistrictName', label: 'Kelurahan', placeholder: 'Pilih kelurahan' },
];

export default function RegionPicker({ value, onChange, errors = {}, bgClass = 'bg-muted', focusClass = 'focus:border-pink', showRequired = true }) {
  const [options, setOptions] = useState([[], [], [], []]);
  const [loadingIdx, setLoadingIdx] = useState(-1);
  const [loadError, setLoadError] = useState('');
  const reqId = useRef([0, 0, 0, 0]); // cegah respons lama menimpa pilihan baru

  async function load(idx, parentCode) {
    const myReq = ++reqId.current[idx];
    setLoadingIdx(idx);
    setLoadError('');
    const res = await getRegionOptions(parentCode);
    if (myReq !== reqId.current[idx]) return;
    if (!res.success) setLoadError('Data wilayah gagal dimuat. Muat ulang halaman lalu coba lagi.');
    setOptions((o) => o.map((opts, i) => (i === idx ? res.options : opts)));
    setLoadingIdx(-1);
  }

  useEffect(() => {
    load(0, null);
  }, []);

  function handleSelect(idx, e) {
    const code = e.target.value;
    const name = options[idx].find((o) => o.id === code)?.name ?? '';

    const patch = {};
    LEVELS.forEach((l, i) => {
      if (i === idx) {
        patch[l.codeKey] = code;
        patch[l.nameKey] = name;
      } else if (i > idx) {
        patch[l.codeKey] = '';
        patch[l.nameKey] = '';
        reqId.current[i]++;
      }
    });
    onChange(patch);
    setOptions((o) => o.map((opts, i) => (i > idx ? [] : opts)));
    if (code && idx < 3) load(idx + 1, code);
  }

  return (
    <>
      {LEVELS.map((l, idx) => {
        const parentFilled = idx === 0 || Boolean(value[LEVELS[idx - 1].codeKey]);
        const isLoading = loadingIdx === idx;
        return (
          <div key={l.key}>
            <label htmlFor={`region-${l.key}`} className="block text-xs font-bold text-foreground mb-1.5">
              {l.label}
              {showRequired ? ' *' : ''}
            </label>
            <div className="relative">
              <select
                id={`region-${l.key}`}
                value={value[l.codeKey]}
                disabled={!parentFilled || isLoading}
                onChange={(e) => handleSelect(idx, e)}
                className={cn('w-full px-3 py-3 rounded-xl border text-sm outline-none appearance-none disabled:cursor-not-allowed disabled:opacity-50', errors[l.key] ? 'border-red-300 bg-red-50' : `border-border ${bgClass} ${focusClass}`)}
              >
                <option value="">{isLoading ? 'Memuat data...' : l.placeholder}</option>
                {options[idx].map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {errors[l.key] && <p className="text-xs text-red-500 mt-1">{errors[l.key]}</p>}
          </div>
        );
      })}
      {loadError && <p className="text-xs text-red-500">{loadError}</p>}
    </>
  );
}
