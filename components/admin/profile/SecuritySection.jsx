"use client";

import { CheckCircle2, KeyRound, Mail, X } from "lucide-react";

export default function SecuritySection({
  email,
  notice,
  onCloseNotice,
  onChangePassword,
  onChangeEmail,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-black text-slate-900">Keamanan Akun</h2>
      </div>

      {notice && (
        <div
          role="status"
          className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-brand-light bg-brand-xlight p-3 text-sm font-bold leading-relaxed text-brand-dark"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            onClick={onCloseNotice}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-brand hover:bg-brand-light"
            aria-label="Tutup pesan"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <KeyRound className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900">Kata Sandi</p>
            <p className="mt-0.5 text-xs text-slate-500">Terakhir diubah 3 bulan lalu</p>
          </div>
          <button
            type="button"
            onClick={onChangePassword}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            Ubah Kata Sandi
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Mail className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900">Email</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
          </div>
          <button
            type="button"
            onClick={onChangeEmail}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            Ubah Email
          </button>
        </div>
      </div>
    </section>
  );
}