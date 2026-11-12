'use server';

import { createClient } from '../../../lib/supabase/server'; // Sesuaikan path client supabase server Anda jika pakai SSR cookies

// Mengambil data profil berdasarkan user yang sedang login
export async function getProfileData(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*, regions(*)')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Aksi Update Profil & Wilayah
export async function updateProfileServer(formData) {
  // Logic update profil, upload avatar, dan sinkronisasi tabel regions
  // Dapat diproses di sini menggunakan Server Actions
  try {
    const supabase = createClient();
    // ... Implementasi update Supabase
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Aksi Hapus Akun
export async function deleteAccountServer(userId) {
  const supabase = createClient();
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw new Error(deleteError.message);
  await supabase.auth.signOut();
  return { success: true };
}