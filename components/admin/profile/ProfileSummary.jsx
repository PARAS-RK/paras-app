"use client";

import { Camera, ShieldCheck, Users } from "lucide-react";
import { defaultProfilePhoto } from "./constants";

export default function ProfileSummary({ profile, photo, onPhotoChange }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
      <div className="bg-brand px-5 pb-14 pt-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/75">
          Ringkasan Profil
        </h2>
      </div>

      <div className="-mt-10 px-5 pb-6 text-center">
        <div className="relative mx-auto w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo || defaultProfilePhoto}
            alt={`Foto profil ${profile.name}`}
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow"
          />
          <label
            className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow hover:bg-slate-700"
            aria-label="Ubah foto profil"
          >
            <Camera className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onPhotoChange(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>

        <h2 className="mt-4 text-xl font-black text-slate-900">{profile.name}</h2>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-dark">
          <ShieldCheck className="h-3.5 w-3.5" /> Ketua
        </span>
        <p className="mt-4 text-sm font-black text-slate-800">TP PKK Kelurahan Kebayoran Baru</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4 text-brand" /> 48 anggota
        </p>
      </div>
    </section>
  );
}