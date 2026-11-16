"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";
import { REASONS, REASON_OTHER, REASON_LEAVE } from "./helpers";

/** onClose harus stabil (useCallback) di pemanggil. mode: "reject" | "suspend". */
export default function ReasonDialog({
  title,
  description,
  mode,
  allowLeave = false,
  confirmLabel,
  onClose,
  onConfirm,
}) {
  const ref = useDialog(onClose);
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const leaving = choice === REASON_LEAVE;
  const reason = choice === REASON_OTHER ? other.trim() : choice;
  const canSubmit = leaving || reason.length > 0;

  const radio = (value, label) => (
    <label
      key={value}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold text-slate-700",
        choice === value ? "border-brand bg-brand-xlight" : "border-slate-200 hover:bg-slate-50"
      )}
    >
      <input
        type="radio"
        name="reason"
        checked={choice === value}
        onChange={() => setChoice(value)}
        className="h-4 w-4 accent-brand"
      />
      {label ?? value}
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h3 id="reason-dialog-title" className="text-base font-black text-slate-900">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>

        <div className="mt-4 space-y-2">
          {REASONS.map((value) => radio(value))}
          {radio(REASON_OTHER)}
          {choice === REASON_OTHER && (
            <textarea
              value={other}
              onChange={(event) => setOther(event.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Tuliskan alasan singkat..."
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          )}
          {allowLeave && (
            <>
              <div className="border-t border-slate-100 pt-2" />
              {radio(REASON_LEAVE)}
              {leaving && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">
                  Keanggotaan PKK menjadi tidak terverifikasi dan akun kembali menjadi warga umum.
                  Data tetap tersimpan dan akun tetap aktif.
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => (leaving ? onConfirm("leave", null) : onConfirm(mode, reason))}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}