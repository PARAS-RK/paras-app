"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/admin";

const PAGE = "/admin/manajemen-pengguna";
const ACTIONS = ["approve", "reject", "suspend", "activate", "leave"];

// Pesan dari fungsi database (raise exception) sudah berbahasa Indonesia dan aman ditampilkan
function messageOf(error) {
  if (error.code === "P0001" || error.code === "42501") return error.message;
  console.error("[users/actions]", error.message);
  return "Terjadi kesalahan sistem. Coba lagi.";
}

/** action: "approve" | "reject" | "suspend" | "activate" | "leave". Alasan wajib untuk reject dan suspend. */
export async function manageUser(userId, action, reason) {
  if (!ACTIONS.includes(action)) return { ok: false, error: "Aksi tidak valid." };

  const admin = await getAdminSession();
  if (!admin) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_user", {
    p_user_id: userId,
    p_action: action,
    p_reason: reason ?? null,
  });
  if (error) return { ok: false, error: messageOf(error) };

  revalidatePath(PAGE);
  return {
    ok: true,
    notice:
      action === "leave"
        ? "Anggota dikeluarkan dari PKK dan kembali menjadi warga umum."
        : undefined,
  };
}