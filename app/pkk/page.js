'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Daftar() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    province: '',
    city: '',
    kecamatan: '',
    kelurahan: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Pendaftaran gagal');
      setDone(true);
    } catch {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  if (done)
    return (
      <p>
        Pendaftaran berhasil. <Link href="/login">Masuk</Link>
      </p>
    );

  return (
    <form onSubmit={handleSubmit}>
      {/* input name, email, phone, password + dropdown wilayah
          (salin pola dropdown dari halaman PKK) */}
      {error && <p className="text-red-500">{error}</p>}
      <button disabled={loading}>{loading ? 'Memproses...' : 'Daftar'}</button>
      <Link href="/daftar/community">Daftarkan komunitas PKK</Link>
    </form>
  );
}
