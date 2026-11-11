"use client";

import { useState } from "react";
import { Ban, Eye, MapPin, Search, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { USERS } from "@/lib/users";
import { useRegistrations } from "@/lib/memberStore";
import { initials, isPkk, typeConfig, statusConfig } from "./users/helpers";
import UserDetail from "./users/UserDetail";
import MemberApproval from "./users/MemberApproval";

export default function UserManagement() {
  const { areaLabel } = useAdmin();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("verification");
  const [statusOverrides, setStatusOverrides] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const registrations = useRegistrations();

  // Pendaftar yang disetujui otomatis jadi pengguna biasa di kelurahan ini
  const approvedUsers = registrations
    .filter((r) => r.status === "approved")
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      type: r.type === "pkk" ? "pkk_member" : "general",
      status: "active",
      area: r.kelurahan,
      address: `${r.kelurahan}, Kec. ${r.kecamatan}`,
      joined: new Date(r.decidedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      reports: 0,
      actions: 0,
    }));

  const users = [...approvedUsers, ...USERS].map((u) =>
    statusOverrides[u.id] ? { ...u, status: statusOverrides[u.id] } : u
  );
  const selectedUser = users.find((u) => u.id === selectedId) || null;
  const query = search.trim().toLowerCase();
  const scopedUsers = users.filter((user) => user.area === areaLabel);

  const filteredUsers = scopedUsers
    .filter((user) => (category === "pkk" ? isPkk(user) : !isPkk(user)))
    .filter(
      (user) =>
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.address.toLowerCase().includes(query)
    );

  const pendingCount = registrations.filter((r) => r.status === "pending" && r.kelurahan === areaLabel).length;

  const tabs = [
    { value: "verification", label: "Verifikasi Anggota", count: pendingCount, tone: "bg-amber-100 text-amber-800" },
    { value: "pkk", label: "Anggota PKK Aktif", count: scopedUsers.filter(isPkk).length },
    { value: "general", label: "Warga Umum Aktif", count: scopedUsers.filter((u) => !isPkk(u)).length },
  ];

  function toggleSuspend(user) {
    setStatusOverrides((current) => ({
      ...current,
      [user.id]: user.status === "suspended" ? "active" : "suspended",
    }));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-black text-slate-900">Manajemen Pengguna</h1>
        <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          {scopedUsers.length} pengguna · {areaLabel}
        </span>
      </header>

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
              <table className="w-full min-w-4xl text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-4">Pengguna</th>
                    <th className="px-5 py-4">Tipe</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Aktivitas</th>
                    <th className="px-5 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const type = typeConfig[user.type];
                    const status = statusConfig[user.status];
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-white">
                              {initials(user.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800">{user.name}</p>
                              <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3 shrink-0" /> {user.address}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", type.pill)}>
                            {type.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", status.pill)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span><strong className="text-slate-800">{user.reports}</strong> laporan</span>
                            <span><strong className="text-slate-800">{user.actions}</strong> aksi</span>
                          </div>
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
                            <button
                              type="button"
                              onClick={() => toggleSuspend(user)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black transition-colors",
                                user.status === "suspended"
                                  ? "border-brand-light text-brand hover:bg-brand-xlight"
                                  : "border-red-200 text-red-700 hover:bg-red-50"
                              )}
                            >
                              {user.status === "suspended" ? <UserCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                              {user.status === "suspended" ? "Aktifkan" : "Suspend"}
                            </button>
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
    </div>
  );
}