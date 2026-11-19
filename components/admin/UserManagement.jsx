"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, MapPin, Search, UserCheck, UserCog, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { useUsers, useUserActions } from "@/context/UsersContext";
import { initials, isPkk, typeConfig, statusConfig } from "./users/helpers";
import UserDetail from "./users/UserDetail";
import MemberApproval from "./users/MemberApproval";
import ReasonDialog from "./users/ReasonDialog";

export default function UserManagement() {
  const { areaLabel, userId } = useAdmin();
  const { users, registrations, loadError } = useUsers();
  const { activate, manage, busyId, error, notice, clearMessages } = useUserActions();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("verification");
  const [selectedId, setSelectedId] = useState(null);
  const [dialog, setDialog] = useState(null); // { user, allowLeave }
  const closeDialog = useCallback(() => setDialog(null), []);

  const selectedUser = users.find((u) => u.id === selectedId) || null;
  const query = search.trim().toLowerCase();

  const filteredUsers = users
    .filter((user) => (category === "pkk" ? isPkk(user) : !isPkk(user)))
    .filter(
      (user) =>
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.address.toLowerCase().includes(query)
    );

  const tabs = [
    { value: "verification", label: "Verifikasi", count: registrations.length, tone: "bg-amber-100 text-amber-800" },
    { value: "pkk", label: "Anggota PKK", count: users.filter(isPkk).length },
    { value: "general", label: "Warga Umum", count: users.filter((u) => !isPkk(u)).length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-black text-slate-900">Manajemen Pengguna</h1>
        <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          {users.length} pengguna · {areaLabel}
        </span>
      </header>

      {(loadError || error) && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {loadError || error}
          </span>
          {error && (
            <button type="button" onClick={clearMessages} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg hover:bg-red-100" aria-label="Tutup pesan">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-brand-light bg-brand-xlight p-4 text-sm font-bold text-brand-dark">
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
          </span>
          <button type="button" onClick={clearMessages} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg hover:bg-brand-light" aria-label="Tutup pesan">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Kategori pengguna">
        {tabs.map(({ value, label, count, tone }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={category === value}
            onClick={() => setCategory(value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black transition-colors",
              category === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[11px]", tone && count > 0 ? tone : "bg-slate-200/70 text-slate-600")}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {category === "verification" ? (
        <MemberApproval />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, email, atau RT/RW..."
                aria-label="Cari pengguna"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-3xl text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-4">Pengguna</th>
                    <th className="px-5 py-4">Tipe</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const type = typeConfig[user.type];
                    const status = statusConfig[user.status] ?? statusConfig.pending;
                    const canManage = user.type !== "pkk_chair" && user.id !== userId;
                    const isActive = user.status === "active";
                    const busy = busyId === user.id;

                    return (
                      <tr key={user.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-white">
                              {initials(user.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800">{user.name}</p>
                              {user.email && <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>}
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3 shrink-0" /> {user.address}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", type.pill)}>{type.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", status.pill)}>{status.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedId(user.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                              aria-label={`Lihat detail ${user.name}`}
                              title="Lihat detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canManage &&
                              (isActive ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setDialog({ user, allowLeave: isPkk(user) })}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                                >
                                  <UserCog className="h-3.5 w-3.5" /> {busy ? "Memproses..." : "Kelola"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => activate(user)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-light px-3 py-2 text-xs font-black text-brand transition-colors hover:bg-brand-xlight disabled:opacity-50"
                                >
                                  <UserCheck className="h-3.5 w-3.5" /> {busy ? "Memproses..." : "Aktifkan"}
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="border-t border-slate-100 py-14 text-center text-sm font-bold text-slate-400">
                Pengguna tidak ditemukan.
              </div>
            )}
          </div>
        </>
      )}

      <UserDetail user={selectedUser} onClose={() => setSelectedId(null)} />

      {dialog && (
        <ReasonDialog
          title={`Kelola ${dialog.user.name}`}
          description={
            dialog.allowLeave
              ? "Pilih alasan suspend, atau keluarkan dari PKK unit ini."
              : "Pilih alasan untuk menonaktifkan akun (suspend)."
          }
          mode="suspend"
          allowLeave={dialog.allowLeave}
          confirmLabel="Terapkan"
          onClose={closeDialog}
          onConfirm={(action, reason) => {
            manage(dialog.user, action, reason);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}