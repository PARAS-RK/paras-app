'use client';

import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Circle, Droplets, Trash2, ShieldCheck, X } from 'lucide-react';
import { cn } from '../lib/utils';
export const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0F6B2A]/40 focus-visible:ring-offset-2';
export const btnPrimary = cn(
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0F6B2A] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0c5822] active:bg-[#09461b] disabled:cursor-not-allowed disabled:bg-[#D1D5DB] disabled:text-[#4B5563]',
  focusRing,
);
export const btnSecondary = cn(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 text-[15px] font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6] active:bg-[#E5E7EB] disabled:cursor-not-allowed disabled:opacity-50',
  focusRing,
);
export const fontWrap = "font-['Noto_Sans',sans-serif] text-[#111827]";
const statusMap = {
  aktif: { label: 'AKTIF', cls: 'bg-[#B3006B] text-white', Icon: Circle },
  'akan-datang': { label: 'AKAN DATANG', cls: 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]', Icon: Calendar },
  selesai: { label: 'SELESAI', cls: 'bg-[#0F6B2A] text-white', Icon: CheckCircle2 },
};
export function StatusBadge({ status }) {
  const s = statusMap[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide shadow-sm', s.cls)}>
      <s.Icon className={cn('h-3.5 w-3.5', status === 'aktif' && 'h-2.5 w-2.5 fill-current')} aria-hidden />
      {s.label}
    </span>
  );
}
const catMap = {
  'Banjir & Drainase': { Icon: Droplets, bg: 'from-[#DBEAFE] via-[#E0F2FE] to-[#D1FAE5]' },
  Sampah: { Icon: Trash2, bg: 'from-[#FCE7F3] via-[#FDF2F8] to-[#FEF3C7]' },
};
export function CategoryArt({ category, className }) {
  const { Icon, bg } = catMap[category];
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', bg, className)} role="img" aria-label={`Ilustrasi ${category}`}>
      <div className="absolute -bottom-8 -left-6 h-32 w-32 rounded-full bg-white/50" />
      <Icon className="absolute bottom-4 left-5 h-12 w-12 text-[#E6008A]/75" strokeWidth={1.5} aria-hidden />
    </div>
  );
}
export function Avatar({ initials, me, size = 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        size === 'sm' ? 'h-8 w-8 text-xs' : size === 'md' ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-sm',
        me ? 'bg-[#0F6B2A] text-white' : 'bg-[#FCE7F3] text-[#B3006B]',
      )}
    >
      {initials}
    </span>
  );
}
export function ProgressBar({ value, big, label }) {
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-[#E5E7EB]', big ? 'h-4' : 'h-2.5')} role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[#159038] transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}
let setToastExt = null;
export const showToast = (t) => setToastExt?.(t);
export function ToastHost() {
  const [t, setT] = useState(null);
  useEffect(() => {
    setToastExt = setT;
    return () => {
      setToastExt = null;
    };
  }, []);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), 3500);
    return () => clearTimeout(h);
  }, [t]);
  if (!t) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-28 z-[60] mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-[#111827] py-1 pl-4 pr-1 text-white shadow-xl lg:bottom-8">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4ADE80]" aria-hidden />
      <p className="flex-1 py-2 text-sm font-semibold">{t.msg}</p>
      <button onClick={() => setT(null)} aria-label="Tutup" className={cn('flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10', focusRing)}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
/* ── Bottom sheet (mobile) / dialog (desktop) ── */
export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cn('max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl lg:max-w-md lg:rounded-2xl lg:p-6', fontWrap)} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#D1D5DB] lg:hidden" />
        {children}
      </div>
    </div>
  );
}
export function JoinModal({ aksi, onClose, onConfirm }) {
  const [agree, setAgree] = useState(false);
  return (
    <Sheet title="Ikut aksi" onClose={onClose}>
      <h2 className="text-xl font-bold">{aksi.title}</h2>
      <p className="mt-2 flex items-center gap-2 text-[15px] text-[#374151]">
        <Calendar className="h-4 w-4 shrink-0 text-[#159038]" aria-hidden />
        {aksi.schedule.date}, {aksi.schedule.time}
      </p>
      <div className="mt-4 rounded-2xl border border-[#FDBA74] bg-[#FFF7ED] p-4">
        <p className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-5 w-5" aria-hidden /> Panduan Keselamatan
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {aksi.safety.slice(0, 2).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#D1D5DB] p-3 text-[15px] has-[:checked]:border-[#0F6B2A] has-[:checked]:bg-[#ECFDF5]">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-6 w-6 shrink-0 accent-[#0F6B2A]" />
        Saya sudah membaca panduan keselamatan
      </label>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button onClick={onClose} className={btnSecondary}>
          Batal
        </button>
        <button onClick={onConfirm} disabled={!agree} className={btnPrimary}>
          Ya, Ikut Aksi
        </button>
      </div>
    </Sheet>
  );
}
/* Compatibility aliases for modules cached during hot reload. */
export const Initials = ({ v, size }) => <Avatar initials={v === 'SAYA' ? 'Saya' : v} me={v === 'SAYA'} size={size} />;
export const ArchivedBadge = () => null;
