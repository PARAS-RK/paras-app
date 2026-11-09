"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Eye, EyeOff, LockKeyhole, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import MemberAvatar from "./MemberAvatar";
import { maskPhone } from "./helpers";

export default function TransferModal({ members, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [understood, setUnderstood] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dialogRef = useRef(null);

  const selected = members.find((member) => member.id === selectedId);
  const visibleMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter(
      (member) => !normalized || member.name.toLowerCase().includes(normalized)
    );
  }, [members, query]);

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    const focusables = () =>
      [...dialog.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')].filter(
        (element) => !element.disabled
      );

    focusables()[0]?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-brand">
              Langkah {step} dari 2
            </p>
            <h2 id="transfer-title" className="mt-1 text-lg font-black text-slate-900">
              {step === 1 ? "Pilih Ketua Baru" : "Konfirmasi Serah Terima Jabatan"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 ? (
          <div className="p-5">
            <label htmlFor="member-search" className="text-xs font-black text-slate-700">
              Cari anggota
            </label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="member-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama anggota"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {visibleMembers.map((member) => {
                const active = selectedId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedId(member.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-brand bg-brand-xlight ring-2 ring-brand/10"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                    aria-pressed={active}
                  >
                    <MemberAvatar name={member.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-900">
                        {member.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {maskPhone(member.phone)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        active ? "border-brand bg-brand text-white" : "border-slate-300"
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
              {visibleMembers.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
                  Anggota tidak ditemukan.
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => setStep(2)}
                className="rounded-xl bg-brand px-4 py-3 text-sm font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Lanjut
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm leading-relaxed text-red-800">
                Anda akan menyerahkan jabatan Ketua kepada <strong>{selected.name}</strong>. Anda
                akan menjadi anggota biasa dan tidak bisa lagi mengakses dashboard admin. Tindakan
                ini tidak bisa dibatalkan.
              </p>
            </div>

            <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={understood}
                onChange={(event) => setUnderstood(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
              />
              Saya mengerti dan ingin melanjutkan.
            </label>

            <label
              htmlFor="transfer-password"
              className="mt-4 block text-xs font-black text-slate-700"
            >
              Masukkan password akun Anda untuk konfirmasi
            </label>
            <div className="relative mt-1.5">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="transfer-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={!understood || !password.trim()}
                onClick={() => onSuccess(selected)}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Serahkan Jabatan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}