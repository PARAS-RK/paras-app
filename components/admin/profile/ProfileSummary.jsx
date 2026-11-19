"use client";

import { Camera, Loader2, ShieldCheck, Users } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import AdminAvatar from "../AdminAvatar";

export default function ProfileSummary() {
  const admin = useAdmin();
  const { upload, uploading, error } = useAvatarUpload();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
      <div className="bg-brand px-5 pb-14 pt-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/75">Ringkasan Profil</h2>
      </div>

      <div className="-mt-10 px-5 pb-6 text-center">
        <div className="relative mx-auto w-fit">
          <AdminAvatar className="h-24 w-24 border-4 border-white bg-brand-light text-3xl text-brand shadow" />
          <label
            className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow hover:bg-slate-700"
            aria-label="Ubah foto profil"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                upload(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-xs font-bold text-red-600">
            {error}
          </p>
        )}

        <h2 className="mt-4 text-xl font-black text-slate-900">{admin.name}</h2>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark">
          <ShieldCheck className="h-3.5 w-3.5" /> Ketua
        </span>
        <p className="mt-4 text-sm font-black text-slate-800">{admin.unitName}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4 text-brand" /> {admin.memberCount} anggota
        </p>
        <p className="mt-3 text-[11px] text-slate-400">JPG, PNG, atau WebP, maksimal 2 MB</p>
      </div>
    </section>
  );
}