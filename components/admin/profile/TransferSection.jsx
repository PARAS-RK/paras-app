"use client";

import { useCallback, useState } from "react";
import { useProfileData } from "@/context/ProfileContext";
import TransferModal from "./TransferModal";

export default function TransferSection() {
  const { candidates } = useProfileData();
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black text-slate-900">Serah Terima Jabatan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Serahkan jabatan Ketua kepada anggota PKK aktif di unit ini.
          </p>
          {candidates.length === 0 && (
            <p className="mt-2 text-xs font-bold text-amber-700">
              Belum ada anggota PKK aktif yang dapat menerima jabatan.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={openModal}
          disabled={candidates.length === 0}
          className="shrink-0 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Serahkan Jabatan
        </button>
      </div>

      {open && <TransferModal members={candidates} onClose={closeModal} />}
    </section>
  );
}