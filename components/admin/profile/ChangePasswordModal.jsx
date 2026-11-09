"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import SecurityDialog from "./SecurityDialog";
import PasswordInput from "./PasswordInput";
import { passwordStrength } from "./helpers";

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });
  const [visible, setVisible] = useState({ old: false, next: false, confirm: false });
  const [oldError, setOldError] = useState(false);

  const mismatch = Boolean(form.confirm && form.next !== form.confirm);
  const strength = passwordStrength(form.next);
  const canSave = Boolean(form.old && form.next && form.confirm && !mismatch);

  function submit(event) {
    event.preventDefault();
    if (!canSave) return;
    // SEMENTARA: password contoh dari Figma. Nanti diganti verifikasi lewat Supabase.
    if (form.old !== "admin123") {
      setOldError(true);
      return;
    }
    onSuccess();
  }

  return (
    <SecurityDialog title="Ubah Kata Sandi" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5">
        <div>
          <PasswordInput
            id="old-password"
            label="Kata sandi lama"
            value={form.old}
            onChange={(value) => {
              setForm({ ...form, old: value });
              setOldError(false);
            }}
            visible={visible.old}
            onToggle={() => setVisible({ ...visible, old: !visible.old })}
            autoComplete="current-password"
          />
          {oldError && (
            <p className="mt-1 text-xs font-bold text-red-600" role="alert">
              Kata sandi lama salah
            </p>
          )}
        </div>

        <div>
          <PasswordInput
            id="new-password"
            label="Kata sandi baru"
            value={form.next}
            onChange={(value) => setForm({ ...form, next: value })}
            visible={visible.next}
            onToggle={() => setVisible({ ...visible, next: !visible.next })}
            autoComplete="new-password"
          />
          <div className="mt-2 flex items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className={cn("block h-full rounded-full transition-all", strength.tone)}
                style={{ width: strength.width }}
              />
            </span>
            <span className={cn("text-xs font-black", strength.text)}>{strength.label}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Minimal 8 karakter, kombinasi huruf dan angka.</p>
        </div>

        <div>
          <PasswordInput
            id="confirm-password"
            label="Konfirmasi kata sandi baru"
            value={form.confirm}
            onChange={(value) => setForm({ ...form, confirm: value })}
            visible={visible.confirm}
            onToggle={() => setVisible({ ...visible, confirm: !visible.confirm })}
            autoComplete="new-password"
          />
          {mismatch && (
            <p className="mt-1 text-xs font-bold text-red-600" role="alert">
              Kata sandi tidak cocok
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Simpan
          </button>
        </div>
      </form>
    </SecurityDialog>
  );
}