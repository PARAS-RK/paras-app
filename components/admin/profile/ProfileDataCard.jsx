"use client";

import { CheckCircle2, Pencil } from "lucide-react";
import { useProfileForm } from "@/hooks/useProfileForm";
import { profileFields } from "./constants";

export default function ProfileDataCard() {
  const { profile, draft, setDraft, editing, saving, error, saved, startEdit, cancelEdit, save } =
    useProfileForm();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="font-black text-slate-900">Data Diri</h2>
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-brand px-3 py-2 text-xs font-black text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mx-5 mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      {saved && !editing && (
        <p role="status" className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-brand-xlight p-3 text-sm font-bold text-brand-dark">
          <CheckCircle2 className="h-4 w-4" /> Profil berhasil disimpan.
        </p>
      )}

      <div className="divide-y divide-slate-100">
        {profileFields.map(({ key, label, icon: Icon, type, editable }) => (
          <label key={key} className="flex gap-3 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-400">{label}</span>
              {editing && editable ? (
                <input
                  type={type}
                  value={draft[key] ?? ""}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                  inputMode={key === "rt" || key === "rw" ? "numeric" : undefined}
                  maxLength={key === "name" ? 100 : key === "rt" || key === "rw" ? 3 : 16}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              ) : (
                <span className="mt-1 block text-sm font-semibold text-slate-800">{profile[key] || "-"}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {editing && (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Wilayah tidak dapat diubah selama Anda menjabat sebagai Ketua.
        </p>
      )}
    </section>
  );
}