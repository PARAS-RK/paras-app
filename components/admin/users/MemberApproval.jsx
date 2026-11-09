"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Clock3, Mail, MapPin, Phone,
  UserCheck, Users, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { areaLabel } from "@/lib/currentUser";
import {
  approveRegistration, deadlineOf, formatRemaining, formatSubmitted,
  rejectRegistration, useRegistrations,
} from "@/lib/memberStore";

const registrationType = {
  pkk: { label: "Anggota PKK", className: "bg-pink-light text-pink-dark", Icon: Users },
  general: { label: "Warga Umum", className: "bg-slate-100 text-slate-700", Icon: UserCheck },
};

// null di render pertama supaya server & browser menghasilkan HTML yang sama (hindari hydration error)
function useNow(interval = 60000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [interval]);
  return now;
}

function TypeBadge({ type }) {
  const t = registrationType[type];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black", t.className)}>
      <t.Icon className="h-3.5 w-3.5" /> {t.label}
    </span>
  );
}

function RejectDialog({ member, onClose, onConfirm }) {
  const [reason, setReason] = useState("Alamat domisili tidak sesuai dengan wilayah kelurahan ini.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-member-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h3 id="reject-member-title" className="text-base font-black text-slate-900">
          Tolak pendaftaran {member.name}?
        </h3>
        <p className="mt-1 text-xs text-slate-500">Alasan penolakan akan dikirim ke email pendaftar.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-4 w-full resize-none rounded-xl border border-red-200 p-3 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-40"
          >
            Tolak Pendaftaran
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingRow({ member, now, onReject }) {
  const ready = now !== null;
  const remaining = ready ? deadlineOf(member) - now : 0;
  const overdue = ready && remaining <= 0;
  const urgent = ready && !overdue && remaining < 6 * 60 * 60 * 1000;

  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-slate-900">{member.name}</p>
          <TypeBadge type={member.type} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {member.email}</span>
          <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {member.phone}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {member.kelurahan}, Kec. {member.kecamatan}
          </span>
        </div>
        {ready && (
          <p className={cn("mt-2 inline-flex items-center gap-1 text-xs font-bold", overdue ? "text-red-600" : urgent ? "text-amber-700" : "text-slate-500")}>
            {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            Didaftarkan {formatSubmitted(member.submittedAt)} ·{" "}
            {overdue ? `Melewati batas 1x24 jam (${formatRemaining(remaining)})` : `Sisa ${formatRemaining(remaining)}`}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-black text-red-700 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" /> Tolak
        </button>
        <button
          type="button"
          onClick={() => approveRegistration(member.id)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-black text-white hover:bg-brand-dark"
        >
          <CheckCircle2 className="h-4 w-4" /> Setujui
        </button>
      </div>
    </li>
  );
}

export default function MemberApproval() {
  const all = useRegistrations().filter((r) => r.kelurahan === areaLabel);
  const now = useNow();
  const [rejecting, setRejecting] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const pending = all.filter((r) => r.status === "pending").sort((a, b) => a.submittedAt - b.submittedAt);
  const decided = all.filter((r) => r.status !== "pending").sort((a, b) => b.decidedAt - a.decidedAt);
  const overdue = now === null ? 0 : pending.filter((r) => deadlineOf(r) <= now).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="member-approval-h">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 id="member-approval-h" className="flex items-center gap-2 text-lg font-black text-slate-900">
            Persetujuan Anggota
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
            <PendingRow key={m.id} member={m} now={now} onReject={() => setRejecting(m)} />
          ))}
        </ul>
      ) : (
        <div className="py-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-brand" />
          <p className="mt-2 text-sm font-black text-slate-800">Tidak ada pendaftar yang menunggu</p>
        </div>
      )}

      {decided.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            aria-expanded={historyOpen}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-xs font-black text-slate-600 hover:bg-slate-50"
          >
            Riwayat keputusan ({decided.length})
            <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
          </button>
          {historyOpen && (
            <ul className="divide-y divide-slate-100 bg-slate-50/60">
              {decided.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                    {m.name} <TypeBadge type={m.type} />
                  </span>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-black", m.status === "approved" ? "text-brand" : "text-red-600")}>
                    {m.status === "approved" ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> Disetujui</>
                    ) : (
                      <><XCircle className="h-3.5 w-3.5" /> Ditolak</>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {rejecting && (
        <RejectDialog
          member={rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => {
            rejectRegistration(rejecting.id, reason);
            setRejecting(null);
          }}
        />
      )}
    </section>
  );
}