"use client";

import { Pencil } from "lucide-react";
import { profileFields } from "./constants";

export default function ProfileDataCard({
  profile,
  draft,
  setDraft,
  editing,
  onEdit,
  onCancel,
  onSave,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="font-black text-slate-900">Data Diri</h2>
        {!editing ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-xl bg-brand px-3 py-2 text-xs font-black text-white hover:bg-brand-dark"
            >
              Simpan
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {profileFields.map(({ key, label, icon: Icon, type }) => (
          <label key={key} className="flex gap-3 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-400">{label}</span>
              {editing ? (
                <input
                  type={type}
                  value={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              ) : (
                <span className="mt-1 block text-sm font-semibold text-slate-800">
                  {profile[key]}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}