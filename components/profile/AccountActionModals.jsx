'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, LogOut, Trash2, XCircle } from 'lucide-react';

function ModalShell({ open, busy, onClose, labelledBy, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

/* ---------- Konfirmasi keluar ---------- */
export function LogoutConfirmModal({ open, loading, onClose, onConfirm }) {
  return (
    <ModalShell open={open} busy={loading} onClose={onClose} labelledBy="logout-title">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
          <LogOut className="h-5 w-5 text-foreground/70" aria-hidden />
        </span>
        <div>
          <h2 id="logout-title" className="text-lg font-black text-foreground">
            Keluar dari akun?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Anda perlu masuk lagi untuk memakai PARAS.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60">
          Batal
        </button>
        <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {loading ? 'Keluar…' : 'Ya, keluar'}
        </button>
      </div>
    </ModalShell>
  );
}

/* ---------- Konfirmasi hapus akun (ketik ulang email) ---------- */
export function DeleteAccountModal({ open, loading, email, error, onClose, onConfirm }) {
  const [value, setValue] = useState('');

  // Akun tanpa email (mis. login nomor HP): konfirmasi memakai kata HAPUS
  const target = email || 'HAPUS';
  const matches = value.trim().toLowerCase() === target.toLowerCase();

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (matches && !loading) onConfirm(value.trim());
  };

  return (
    <ModalShell open={open} busy={loading} onClose={onClose} labelledBy="delete-title">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
          </span>
          <div>
            <h2 id="delete-title" className="text-lg font-black text-foreground">
              Hapus akun secara permanen?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Profil dan data akun Anda akan dihapus dan tidak bisa dikembalikan.</p>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="confirm-delete" className="text-sm font-semibold text-foreground">
            {email ? (
              <>
                Ketik email akun untuk melanjutkan: <span className="break-all font-black">{email}</span>
              </>
            ) : (
              <>
                Ketik <span className="font-black">HAPUS</span> untuk melanjutkan
              </>
            )}
          </label>
          <input
            id="confirm-delete"
            type="text"
            inputMode={email ? 'email' : 'text'}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
            placeholder={target}
            className="mt-2 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60">
            Batal
          </button>
          <button
            type="submit"
            disabled={!matches || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
            {loading ? 'Menghapus…' : 'Hapus akun saya'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------- Modal status (berhasil / gagal), dipakai mis. di Ubah Kata Sandi ---------- */
export function StatusModal({ open, type = 'success', title, message, buttonLabel = 'Tutup', onClose }) {
  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <ModalShell open={open} busy={false} onClose={onClose} labelledBy="status-title">
      <div className="flex flex-col items-center text-center">
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${isSuccess ? 'bg-brand-light text-brand' : 'bg-red-50 text-red-600'}`}>
          <Icon className="h-7 w-7" aria-hidden />
        </span>
        <h2 id="status-title" className="mt-4 text-lg font-black text-foreground">
          {title}
        </h2>
        {message && (
          <p role={isSuccess ? 'status' : 'alert'} className="mt-1 text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>

      <button type="button" autoFocus onClick={onClose} className={`mt-6 w-full rounded-xl py-3 text-sm font-black text-white hover:opacity-90 ${isSuccess ? 'bg-brand' : 'bg-red-600'}`}>
        {buttonLabel}
      </button>
    </ModalShell>
  );
}
