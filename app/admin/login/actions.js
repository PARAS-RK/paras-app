"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin";

const MESSAGES = {
  not_admin: "Akun ini tidak memiliki akses admin",
  inactive: "Akun Anda tidak aktif. Hubungi pengelola.",
  no_unit: "Akun Anda belum terhubung ke unit PKK",
  unverified: "Unit PKK Anda belum terverifikasi",
  not_logged_in: "Email atau kata sandi salah",
};

function back(message) {
  redirect("/admin/login?error=" + encodeURIComponent(message));
}

export async function adminLogin(formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) back("Email dan kata sandi wajib diisi");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) back("Email atau kata sandi salah");

  // Login berhasil belum berarti boleh masuk: cek ketua, aktif, dan unit terverifikasi
  const { admin, reason } = await checkAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    back(MESSAGES[reason] ?? "Akun ini tidak memiliki akses admin");
  }

  redirect("/admin");
}