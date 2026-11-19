"use client";

import { useEffect, useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { requestEmailChange, verifyEmailChange } from "@/lib/profile/actions";
import SecurityDialog from "./SecurityDialog";
import PasswordInput from "./PasswordInput";

const codeInput =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-lg font-black tracking-[0.4em] text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10";

export default function ChangeEmailModal({ onClose, onSuccess }) {
  const { email: currentEmail } = useAdmin();
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeCurrent, setCodeCurrent] = useState("");
  const [codeNew, setCodeNew] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function send(event) {
    event?.preventDefault();
    if (pending || !newEmail || !password) return;
    setError("");
    startTransition(async () => {
      const result = await requestEmailChange(newEmail, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep(2);
      setCountdown(60);
    });
  }

  function verify() {
    if (pending) return;
    setError("");
    startTransition(async () => {
      const result = await verifyEmailChange(newEmail, codeNew, codeCurrent);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess();
    });
  }

  const onlyDigits = (value) => value.replace(/\D/g, "").slice(0, 6);

  return (
    <SecurityDialog title={step === 1 ? "Ubah Email" : "Verifikasi Email"} onClose={onClose}>
      {step === 1 ? (
        <form onSubmit={send} className="space-y-4 p-5">
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

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">
              {error}
            </p>
          )}

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
              disabled={!newEmail || !password || pending}
              className="rounded-xl bg-brand px-3 py-3 text-sm font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {pending ? "Mengirim..." : "Kirim Kode"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Kami mengirim kode 6 digit ke email lama (<strong>{currentEmail}</strong>) dan email baru (
            <strong>{newEmail}</strong>). Masukkan keduanya.
          </p>

          <label htmlFor="code-current" className="block text-xs font-black text-slate-700">
            Kode dari email lama
            <input
              id="code-current"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codeCurrent}
              onChange={(event) => setCodeCurrent(onlyDigits(event.target.value))}
              className={codeInput}
            />
          </label>
          <label htmlFor="code-new" className="block text-xs font-black text-slate-700">
            Kode dari email baru
            <input
              id="code-new"
              inputMode="numeric"
              value={codeNew}
              onChange={(event) => setCodeNew(onlyDigits(event.target.value))}
              className={codeInput}
            />
          </label>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-xs font-semibold text-slate-500">Kirim ulang dalam {countdown} detik</p>
            ) : (
              <button type="button" onClick={send} disabled={pending} className="text-xs font-black text-brand hover:underline">
                Kirim ulang kode
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError("");
              }}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={codeCurrent.length !== 6 || codeNew.length !== 6 || pending}
              onClick={verify}
              className="rounded-xl bg-brand px-4 py-3 text-sm font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {pending ? "Memverifikasi..." : "Verifikasi"}
            </button>
          </div>
        </div>
      )}
    </SecurityDialog>
  );
}