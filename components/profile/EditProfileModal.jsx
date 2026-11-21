'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { StatusModal } from './AccountActionModals';

export default function EditProfileModal({ isOpen, onClose, currentProfile, onSuccess }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [rt, setRt] = useState('');
  const [rw, setRw] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentProfile && isOpen) {
      setName(currentProfile.full_name || '');
      setPhoneNumber(currentProfile.phone || currentProfile.phone_number || '');
      setEmail(currentProfile.email || '');
      setAvatarUrl(currentProfile.avatar_url || '');
      setPreviewUrl(currentProfile.avatar_url || '');
      setAvatarFile(null);
      setRt(currentProfile.rt || '');
      setRw(currentProfile.rw || '');
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran foto maksimal 2MB.');
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('Pengguna tidak terautentikasi.');

      // 1. Upload avatar jika user memilih foto baru
      let uploadedAvatarUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        uploadedAvatarUrl = publicUrlData.publicUrl;
      }

      // 2. UPDATE tabel profiles tetapi wilayah mengikuti unit PKK dan hanya bisa diubah oleh admin.
      const updatePayload = {
        phone_number: phoneNumber,
        avatar_url: uploadedAvatarUrl,
        rt,
        rw,
      };

      const { error: saveError } = await supabase.from('profiles').update(updatePayload).eq('user_id', user.id);

      if (saveError) {
        throw new Error('Gagal menyimpan profil: ' + saveError.message);
      }

      // 3. Ganti email: Supabase mengirim email konfirmasi,
      //email baru baru berlaku setelah dikonfirmasi.
      let emailPending = false;
      if (email && email !== currentProfile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile` });
        if (emailError) {
          const taken = /already|registered|exists/i.test(emailError.message || '');
          throw new Error(taken ? 'Email ini sudah dipakai akun lain.' : emailError.message);
        }
        emailPending = true;
      }

      onSuccess?.({
        full_name: name,
        phone: phoneNumber,
        phone_number: phoneNumber,
        email: currentProfile?.email ?? '',
        avatar_url: uploadedAvatarUrl,
        rt,
        rw,
      });

      if (emailPending) {
        setEmailNotice(email);
      } else {
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (text) => {
    if (!text) return 'WJ';
    return text
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Wilayah tidak bisa diubah
  const regionFields = [
    ['Provinsi', currentProfile?.province],
    ['Kota/Kabupaten', currentProfile?.city],
    ['Kecamatan', currentProfile?.kecamatan],
    ['Kelurahan', currentProfile?.kelurahan],
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-black text-foreground">Ubah Profil</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMsg && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-500">{errorMsg}</p>}

            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover border-4 border-brand-light shadow-sm" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-brand-light bg-brand-light text-2xl font-black text-brand shadow-sm">{getInitials(name)}</div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow hover:bg-brand-dark"
                  title="Ganti Foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <p className="text-[11px] text-muted-foreground">Format JPG/PNG, maks 2MB</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                disabled
                readOnly
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
                required
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Mengganti email memerlukan konfirmasi dari <b>email lama</b> dan <b>email baru</b>. Perubahan baru berlaku setelah kedua tautan diklik.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">Nomor HP</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08xxxxxxxxxx"
                required
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
              />
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Lokasi Domisili</h4>
                <p className="mt-1 text-[11px] text-muted-foreground">Wilayah mengikuti unit PKK Anda dan tidak dapat diubah di sini.</p>
              </div>

              {regionFields.map(([label, value]) => (
                <div key={label}>
                  <label className="mb-1 block text-xs font-bold text-foreground">{label}</label>
                  <input type="text" value={value || '-'} aria-label={label} disabled readOnly className="w-full cursor-not-allowed rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="mb-1 block text-xs font-bold text-foreground">RT</label>
                  <input type="text" value={rt} onChange={(e) => setRt(e.target.value)} placeholder="001" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-foreground">RW</label>
                  <input type="text" value={rw} onChange={(e) => setRw(e.target.value)} placeholder="005" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted">
                Batal
              </button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-black text-white hover:bg-brand-dark disabled:opacity-50">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>

      <StatusModal
        open={!!emailNotice}
        type="success"
        title="Cek email Anda"
        message={`Demi keamanan, kami mengirim tautan konfirmasi ke dua alamat: email lama (${currentProfile?.email || 'email Anda saat ini'}) dan email baru (${emailNotice}). Buka kedua kotak masuk (cek juga folder Spam) lalu klik kedua tautannya. Email baru baru berlaku setelah keduanya dikonfirmasi; sampai saat itu Anda tetap masuk dengan email lama.`}
        buttonLabel="Mengerti"
        onClose={() => {
          setEmailNotice('');
          onClose();
        }}
      />
    </>
  );
}
