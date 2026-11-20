'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { StatusModal } from './AccountActionModals';

export default function PasswordForm({ onDone }) {
  const [f, setF] = useState({ old: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message?: string }

  const err = f.next && f.next.length < 8 ? 'Minimal 8 karakter.' : f.confirm && f.confirm !== f.next ? 'Konfirmasi tidak sama.' : null;
  const ok = f.old && f.next.length >= 8 && f.next === f.confirm;
  const input = 'mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ok || loading) return;
    setLoading(true);
    try {
      const supabase = createClient();

      // Verifikasi kata sandi lama dulu (jika akun punya email)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: f.old,
        });
        if (verifyError) {
          if (verifyError.code === 'invalid_credentials') throw new Error('Kata sandi saat ini salah.');
          throw verifyError;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: f.next });
      if (error) throw error;

      setF({ old: '', next: '', confirm: '' });
      setStatus({ type: 'success' });
    } catch (error) {
      const message = error.code === 'same_password' ? 'Kata sandi baru harus berbeda dari kata sandi lama.' : error.message || 'Terjadi kesalahan. Coba lagi.';
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  // Setelah sukses, form ditutup saat modal ditutup. Jika gagal, form tetap terbuka.
  const closeStatus = () => {
    const wasSuccess = status?.type === 'success';
    setStatus(null);
    if (wasSuccess) onDone?.();
  };

  return (
    <>
      <form className="space-y-3 border-t border-border bg-muted/30 px-5 py-4" onSubmit={handleSubmit}>
        {[
          ['old', 'Kata sandi saat ini'],
          ['next', 'Kata sandi baru'],
          ['confirm', 'Ulangi kata sandi baru'],
        ].map(([k, l]) => (
          <label key={k} className="block text-sm font-semibold text-foreground">
            {l}
            <input type="password" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={input} autoComplete={k === 'old' ? 'current-password' : 'new-password'} disabled={loading} />
          </label>
        ))}
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}
        <button disabled={!ok || loading} className="w-full rounded-xl bg-brand py-3 text-sm font-black text-white disabled:opacity-40">
          {loading ? 'Menyimpan…' : 'Simpan Kata Sandi'}
        </button>
      </form>

      <StatusModal
        open={!!status}
        type={status?.type}
        title={status?.type === 'success' ? 'Kata sandi diperbarui' : 'Gagal memperbarui kata sandi'}
        message={status?.type === 'success' ? 'Gunakan kata sandi baru saat Anda masuk berikutnya.' : status?.message}
        buttonLabel={status?.type === 'success' ? 'Selesai' : 'Coba lagi'}
        onClose={closeStatus}
      />
    </>
  );
}
