"use client";

import { CalendarDays, FileText, Leaf, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, typeConfig, statusConfig } from "./helpers";

export default function UserDetail({ user, onClose }) {
  if (!user) return null;
  const type = typeConfig[user.type];
  const status = statusConfig[user.status];
  const activity = [
    ...(user.reports > 0 ? [{ icon: FileText, text: `${user.reports} laporan warga dikirim`, tone: "bg-blue-50 text-blue-600" }] : []),
    ...(user.actions > 0 ? [{ icon: Leaf, text: `${user.actions} aksi komunitas diikuti`, tone: "bg-brand-xlight text-brand" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
              {initials(user.name)}
            </span>
            <div>
              <h2 id="user-detail-title" className="font-black text-slate-900">{user.name}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup detail"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", type.pill)}>{type.label}</span>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", status.pill)}>{status.label}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-400">Wilayah</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-black text-slate-800">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" /> {user.address}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-400">Terdaftar</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-black text-slate-800">
                <CalendarDays className="h-3.5 w-3.5 text-brand" /> {user.joined}
              </p>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-black text-slate-900">Riwayat Aktivitas</h3>
          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.text} className="flex items-center gap-3 p-4">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.tone)}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-bold text-slate-700">{item.text}</p>
                </div>
              ))
            ) : (
              <p className="p-5 text-center text-xs text-slate-400">Belum ada aktivitas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}