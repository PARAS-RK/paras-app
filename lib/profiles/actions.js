"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/admin";

export async function updateProfile(values) {
  const admin = await getAdminSession();
  if (!admin) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const name = String(values.name ?? "").trim();
  const phone = String(values.phone ?? "").replace(/[\s-]/g, "");
  const rt = String(values.rt ?? "").trim();
  const rw = String(values.rw ?? "").trim();

  if (!name || name.length > 100) {
    return { ok: false, error: "Nama wajib diisi (maksimal 100 karakter)." };
  }
  if (phone && !/^\+?[0-9]{8,15}$/.test(phone)) {
    return { ok: false, error: "Nomor HP tidak valid (8 sampai 15 digit)." };
  }
  if ((rt && !/^[0-9]{1,3}$/.test(rt)) || (rw && !/^[0-9]{1,3}$/.test(rw))) {
    return { ok: false, error: "RT dan RW harus berupa angka." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name, phone_number: phone || null, rt: rt || null, rw: rw || null })
    .eq("user_id", admin.userId);

  if (error) {
    console.error("[updateProfile]", error.message);
    return {
      ok: false,
      error: error.code === "23505" ? "Nomor HP sudah dipakai akun lain." : "Gagal menyimpan. Coba lagi.",
    };
  }

  revalidatePath("/admin", "layout"); // nama di sidebar ikut berubah
  return { ok: true };
}