"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import SecurityDialog from "./SecurityDialog";
import PasswordInput from "./PasswordInput";

const EMPTY_CODE = ["", "", "", "", "", ""];

export default function ChangeEmailModal({ currentEmail, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState(EMPTY_CODE);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [step, countdown]);

  function updateCode(index, value) {
    const next = [...code];
    next[index] = value.replace(/\D/g, "").slice(-1);
    setCode(next);
    if (next[index] && index < 5) document.getElementById(`email-code-${index + 1}`)?.focus();
  }

  return (
    <SecurityDialog title={step === 1 ? "Ubah Email" : "Verifikasi Email Baru"} onClose={onClose}>
      {step === 1 ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (newEmail && password) setStep(2);
          }}
          className="space-y-4 p-5"
        >
          <label htmlFor="current-email" className="block text-xs font-black text-slate-700">
            Email saat ini
            <input
              id="current-email"
              type="email"
              value={currentEmail}
              readOnly
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-500"
            />
          </label>

          <label htmlFor="new-email" className="block text-xs font-black text-slate-700">
            Email baru
            <span className="relative mt-1.5 block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="new-email"
                type="email"
                required
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Masukkan email baru"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </span>
          </label>

          <PasswordInput
            id="current-email-password"
            label="Kata sandi saat ini"
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            autoComplete="current-password"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!newEmail || !password}
              className="rounded-xl bg-brand px-3 py-3 text-sm font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Kirim Kode Verifikasi
            </button>
          </div>
        </form>
      ) : (
        <div className="p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Kami telah mengirim kode 6 digit ke {newEmail}.
          </p>
          <div className="mt-5 grid grid-cols-6 gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`email-code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => updateCode(index, event.target.value)}
                aria-label={`Digit ${index + 1}`}
                className="h-12 min-w-0 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-black text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            ))}
          </div>

          <div className="mt-4 text-center">
            {countdown > 0 ? (
              <p className="text-xs font-semibold text-slate-500">Kirim ulang dalam {countdown} detik</p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCountdown(60);
                  setCode(EMPTY_CODE);
                }}
                className="text-xs font-black text-brand hover:underline"
              >
                Kirim ulang kode
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={code.join("").length !== 6}
              onClick={() => onSuccess(newEmail)}
              className="rounded-xl bg-brand px-4 py-3 text-sm font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Verifikasi
            </button>
          </div>
        </div>
      )}
    </SecurityDialog>
  );
}