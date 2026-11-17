"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DangerZone() {
  const [notice, setNotice] = useState(false);

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-black text-red-800">
            <AlertTriangle className="h-5 w-5" /> Zona Berbahaya
          </h2>
          <p className="mt-1 text-sm text-red-700">
            Penghapusan akun bersifat permanen dan tidak dapat dibatalkan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNotice(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" /> Hapus Akun
        </button>
      </div>

      {notice && (
        <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-white p-4">
          <p className="text-sm font-bold leading-relaxed text-red-700">
            Anda masih menjabat sebagai Ketua. Serahkan jabatan terlebih dahulu. Setelah itu akun dapat
            dihapus dari halaman profil.
          </p>
          <button
            type="button"
            onClick={() => setNotice(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
            aria-label="Tutup pesan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}