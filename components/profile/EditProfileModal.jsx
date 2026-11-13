'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function EditProfileModal({ isOpen, onClose, currentProfile, onSuccess }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Lokasi Domisili States
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedRegencyId, setSelectedRegencyId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  const [provinceName, setProvinceName] = useState('');
  const [cityName, setCityName] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [rt, setRt] = useState('');
  const [rw, setRw] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Fetch provinces
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error('Gagal memuat provinsi:', err));
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`)
        .then((res) => res.json())
        .then((data) => setRegencies(data))
        .catch((err) => console.error('Gagal memuat kota/kabupaten:', err));
    } else {
      setRegencies([]);
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedRegencyId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegencyId}.json`)
        .then((res) => res.json())
        .then((data) => setDistricts(data))
        .catch((err) => console.error('Gagal memuat kecamatan:', err));
    } else {
      setDistricts([]);
    }
  }, [selectedRegencyId]);

  useEffect(() => {
    if (selectedDistrictId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrictId}.json`)
        .then((res) => res.json())
        .then((data) => setVillages(data))
        .catch((err) => console.error('Gagal memuat kelurahan:', err));
    } else {
      setVillages([]);
    }
  }, [selectedDistrictId]);

  // Isi nilai awal saat modal dibuka
  useEffect(() => {
    if (currentProfile && isOpen) {
      setName(currentProfile.full_name || '');
      setPhoneNumber(currentProfile.phone || currentProfile.phone_number || '');
      setEmail(currentProfile.email || '');
      setAvatarUrl(currentProfile.avatar_url || '');
      setPreviewUrl(currentProfile.avatar_url || '');
      setAvatarFile(null);
      setCityName(currentProfile.city || '');
      setKecamatan(currentProfile.kecamatan || '');
      setKelurahan(currentProfile.kelurahan || '');
      setRt(currentProfile.rt || '');
      setRw(currentProfile.rw || '');

      if (currentProfile.province && provinces.length > 0) {
        const foundProv = provinces.find(
          (p) => p.name.toLowerCase() === currentProfile.province.toLowerCase()
        );
        if (foundProv) {
          setSelectedProvinceId(foundProv.id);
          setProvinceName(foundProv.name);
        }
      }
    }
  }, [currentProfile, isOpen, provinces]);

  // Auto-match Kota/Kabupaten
  useEffect(() => {
    if (isOpen && currentProfile?.city && regencies.length > 0 && !selectedRegencyId) {
      const foundReg = regencies.find(
        (r) => r.name.toLowerCase() === currentProfile.city.toLowerCase()
      );
      if (foundReg) {
        setSelectedRegencyId(foundReg.id);
        setCityName(foundReg.name);
      }
    }
  }, [regencies, currentProfile, isOpen, selectedRegencyId]);

  // Auto-match Kecamatan
  useEffect(() => {
    if (isOpen && currentProfile?.kecamatan && districts.length > 0 && !selectedDistrictId) {
      const foundDist = districts.find(
        (d) => d.name.toLowerCase() === currentProfile.kecamatan.toLowerCase()
      );
      if (foundDist) {
        setSelectedDistrictId(foundDist.id);
        setKecamatan(foundDist.name);
      }
    }
  }, [districts, currentProfile, isOpen, selectedDistrictId]);

  // Auto-match Kelurahan
  useEffect(() => {
    if (isOpen && currentProfile?.kelurahan && villages.length > 0 && !selectedVillageId) {
      const foundVil = villages.find(
        (v) => v.name.toLowerCase() === currentProfile.kelurahan.toLowerCase()
      );
      if (foundVil) {
        setSelectedVillageId(foundVil.id);
        setKelurahan(foundVil.name);
      }
    }
  }, [villages, currentProfile, isOpen, selectedVillageId]);

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('Pengguna tidak terautentikasi.');

      // 1. Upload avatar jika user memilih foto baru
      let uploadedAvatarUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        uploadedAvatarUrl = publicUrlData.publicUrl;
      }

      // 2. Cari region_id yang sudah ada di tabel regions (hanya SELECT, tidak mengubah tabel regions)
      let targetRegionId = currentProfile?.region_id || null;
      if (selectedVillageId) {
        let { data: existingRegion } = await supabase
          .from('regions')
          .select('region_id')
          .eq('subdistrict_code', selectedVillageId)
          .maybeSingle();

        if (!existingRegion && kelurahan) {
          const { data: regionByName } = await supabase
            .from('regions')
            .select('region_id')
            .eq('subdistrict', kelurahan)
            .eq('city', cityName)
            .maybeSingle();
          existingRegion = regionByName;
        }

        if (existingRegion) {
          targetRegionId = existingRegion.region_id;
        }
      }

      // 3. Langsung UPDATE tabel profiles (termasuk rt dan rw)
      const updatePayload = {
        full_name: name,
        phone_number: phoneNumber,
        avatar_url: uploadedAvatarUrl,
        rt: rt,
        rw: rw,
      };

      if (targetRegionId) {
        updatePayload.region_id = parseInt(targetRegionId, 10);
      }

      const { error: saveError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('user_id', user.id);

      if (saveError) {
        throw new Error('Gagal menyimpan profil: ' + saveError.message);
      }

      // 4. Update email jika berubah
      if (email && email !== currentProfile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
      }

      if (onSuccess) {
        onSuccess({
          full_name: name,
          phone: phoneNumber,
          phone_number: phoneNumber,
          email: email,
          avatar_url: uploadedAvatarUrl,
          region_id: targetRegionId,
          city: cityName,
          kecamatan: kecamatan,
          kelurahan: kelurahan,
          province: provinceName,
          rt: rt,
          rw: rw,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (text) => {
    if (!text) return 'WJ';
    return text.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
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
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-brand-light bg-brand-light text-2xl font-black text-brand shadow-sm">
                  {getInitials(name)}
                </div>
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
            <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Lokasi Domisili</h4>

            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">Provinsi</label>
              <select
                value={selectedProvinceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedProvinceId(id);
                  const found = provinces.find((p) => p.id === id);
                  setProvinceName(found ? found.name : '');
                  setSelectedRegencyId('');
                  setCityName('');
                  setSelectedDistrictId('');
                  setKecamatan('');
                  setSelectedVillageId('');
                  setKelurahan('');
                }}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="">Pilih provinsi</option>
                {provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>{prov.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">Kota/Kabupaten</label>
              <select
                value={selectedRegencyId}
                disabled={!selectedProvinceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedRegencyId(id);
                  const found = regencies.find((r) => r.id === id);
                  setCityName(found ? found.name : '');
                  setSelectedDistrictId('');
                  setKecamatan('');
                  setSelectedVillageId('');
                  setKelurahan('');
                }}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-50"
              >
                <option value="">Pilih kota/kabupaten</option>
                {regencies.map((reg) => (
                  <option key={reg.id} value={reg.id}>{reg.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">Kecamatan</label>
              <select
                value={selectedDistrictId}
                disabled={!selectedRegencyId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedDistrictId(id);
                  const found = districts.find((d) => d.id === id);
                  setKecamatan(found ? found.name : '');
                  setSelectedVillageId('');
                  setKelurahan('');
                }}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-50"
              >
                <option value="">Pilih kecamatan</option>
                {districts.map((dist) => (
                  <option key={dist.id} value={dist.id}>{dist.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">Kelurahan</label>
              <select
                value={selectedVillageId}
                disabled={!selectedDistrictId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedVillageId(id);
                  const found = villages.find((v) => v.id === id);
                  setKelurahan(found ? found.name : '');
                }}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-50"
              >
                <option value="">Pilih kelurahan</option>
                {villages.map((vil) => (
                  <option key={vil.id} value={vil.id}>{vil.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="mb-1 block text-xs font-bold text-foreground">RT</label>
                <input
                  type="text"
                  value={rt}
                  onChange={(e) => setRt(e.target.value)}
                  placeholder="001"
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-foreground">RW</label>
                <input
                  type="text"
                  value={rw}
                  onChange={(e) => setRw(e.target.value)}
                  placeholder="005"
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
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
  );
}