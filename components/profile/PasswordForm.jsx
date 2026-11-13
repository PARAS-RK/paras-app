'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function PasswordForm({ onDone }) {
  const [f, setF] = useState({ old: '', next: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const err = f.next && f.next.length < 8 ? 'Minimal 8 karakter.' : f.confirm && f.confirm !== f.next ? 'Konfirmasi tidak sama.' : null;
  const ok = f.old && f.next.length >= 8 && f.next === f.confirm;
  const input = 'mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

  return (
    <form
      className="space-y-3 border-t border-border bg-muted/30 px-5 py-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ok) return;
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({ password: f.next });
          if (error) throw error;

          setMsg('Kata sandi berhasil diperbarui.');
          setF({ old: '', next: '', confirm: '' });
          setTimeout(onDone, 1200);
        } catch (err) {
          alert('Gagal memperbarui kata sandi: ' + err.message);
        }
      }}
    >
      {[['old', 'Kata sandi saat ini'], ['next', 'Kata sandi baru'], ['confirm', 'Ulangi kata sandi baru']].map(([k, l]) => (
        <label key={k} className="block text-sm font-semibold text-foreground">
          {l}
          <input type="password" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={input} autoComplete={k === 'old' ? 'current-password' : 'new-password'} />
        </label>
      ))}
      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
      {msg && <p className="flex items-center gap-1.5 text-sm font-bold text-brand" role="status"><Check className="h-4 w-4" />{msg}</p>}
      <button disabled={!ok} className="w-full rounded-xl bg-brand py-3 text-sm font-black text-white disabled:opacity-40">
        Simpan Kata Sandi
      </button>
    </form>
  );
}