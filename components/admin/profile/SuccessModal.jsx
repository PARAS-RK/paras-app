"use client";

import { CheckCircle2 } from "lucide-react";

export default function SuccessModal({ member, onDone }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 id="success-title" className="mt-4 text-lg font-black text-slate-900">
          Serah Terima Berhasil
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Jabatan berhasil diserahkan kepada {member.name}.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-5 w-full rounded-xl bg-brand px-4 py-3 text-sm font-black text-white hover:bg-brand-dark"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}