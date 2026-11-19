"use client";

import { useCallback, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Clock3, Mail, MapPin, Phone, UserCheck, Users, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { useUsers, useUserActions } from "@/context/UsersContext";
import { useNow } from "@/hooks/useNow";
import { deadlineOf, formatRemaining, formatSubmitted } from "@/lib/users/time";
import ReasonDialog from "./ReasonDialog";

const registrationType = {
  pkk: { label: "Anggota PKK", className: "bg-pink-light text-pink-dark", Icon: Users },
  general: { label: "Warga Umum", className: "bg-slate-100 text-slate-700", Icon: UserCheck },
};

function TypeBadge({ type }) {
  const t = registrationType[type];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black", t.className)}>
      <t.Icon className="h-3.5 w-3.5" /> {t.label}
    </span>
  );
}

function PendingRow({ member, now, busy, onApprove, onReject }) {
  const ready = now !== null && member.submittedAt;
  const remaining = ready ? deadlineOf(member) - now : 0;
  const overdue = ready && remaining <= 0;
  const urgent = ready && !overdue && remaining < 6 * 60 * 60 * 1000;

  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-slate-900">{member.name}</p>
          <TypeBadge type={member.type} />
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">Belum aktif</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {member.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {member.email}</span>}
          {member.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {member.phone}</span>}
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {member.kelurahan}, Kec. {member.kecamatan}
          </span>
        </div>
        {ready && (
          <p className={cn("mt-2 inline-flex items-center gap-1 text-xs font-bold", overdue ? "text-red-600" : urgent ? "text-amber-700" : "text-slate-500")}>
            {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            Didaftarkan {formatSubmitted(member.submittedAt, now)} ·{" "}
            {overdue ? `Melewati batas 1x24 jam (${formatRemaining(remaining)})` : `Sisa ${formatRemaining(remaining)}`}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" /> Tolak
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-black text-white hover:bg-brand-dark disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" /> {busy ? "Memproses..." : "Setujui"}
        </button>
      </div>
    </li>
  );
}

export default function MemberApproval() {
  const { areaLabel } = useAdmin();
  const { registrations } = useUsers();
  const { approve, manage, busyId } = useUserActions();
  const now = useNow();
  const [rejecting, setRejecting] = useState(null);
  const closeReject = useCallback(() => setRejecting(null), []);

  const pending = [...registrations].sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
  const overdue = now === null ? 0 : pending.filter((r) => r.submittedAt && deadlineOf(r) <= now).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="member-approval-h">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 id="member-approval-h" className="flex items-center gap-2 text-lg font-black text-slate-900">
            Persetujuan Pendaftar
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800">
              {pending.length} menunggu
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Pendaftar dengan alamat di {areaLabel}. Setujui dalam 1x24 jam sejak pendaftaran.
          </p>
        </div>
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" /> {overdue} melewati 1x24 jam
          </span>
        )}
      </div>

      {pending.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {pending.map((m) => (
            <PendingRow
              key={m.id}
              member={m}
              now={now}
              busy={busyId === m.id}
              onApprove={() => approve(m)}
              onReject={() => setRejecting(m)}
            />
          ))}
        </ul>
      ) : (
        <div className="py-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-brand" />
          <p className="mt-2 text-sm font-black text-slate-800">Tidak ada pendaftar yang menunggu</p>
        </div>
      )}

      {rejecting && (
        <ReasonDialog
          title={`Tolak ${rejecting.name}?`}
          description="Pilih alasan penolakan. Akun akan di-suspend dan alasannya tercatat."
          mode="reject"
          confirmLabel="Tolak"
          onClose={closeReject}
          onConfirm={(action, reason) => {
            manage(rejecting, action, reason);
            setRejecting(null);
          }}
        />
      )}
    </section>
  );
}