"use client";

export default function TransferSection({ onOpen }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black text-slate-900">Serah Terima Jabatan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Serahkan jabatan Ketua kepada anggota terdaftar di wilayah ini.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          Serahkan Jabatan
        </button>
      </div>
    </section>
  );
}