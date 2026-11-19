"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164 } from "./format";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_ENDED = "Sesi berakhir. Silakan masuk kembali.";

const fail = (error) => ({ ok: false, error });
const digits = (value) => String(value ?? "").replace(/\D/g, "");

// Pesan dari fungsi database (raise exception) sudah berbahasa Indonesia dan aman ditampilkan
function messageOf(error) {
  if (error?.code === "P0001" || error?.code === "42501") return error.message;
  if (error?.code === "23505") return "Nomor HP sudah dipakai akun lain.";
  console.error("[profile/actions]", error?.message);
  return "Terjadi kesalahan sistem. Coba lagi.";
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function passwordOk(supabase, email, password) {
  if (!email || !password) return false;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function updateMyProfile(values) {
  const { supabase, user } = await requireUser();
  if (!user) return fail(SESSION_ENDED);

  const { error } = await supabase.rpc("update_my_profile", {
    p_full_name: String(values?.name ?? ""),
    p_phone: toE164(values?.phone),
    p_rt: String(values?.rt ?? ""),
    p_rw: String(values?.rw ?? ""),
    p_region_id: values?.regionId ?? null,
  });
  if (error) return fail(messageOf(error));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setMyAvatar(avatarUrl) {
  const { supabase, user } = await requireUser();
  if (!user) return fail(SESSION_ENDED);

  const { error } = await supabase.rpc("set_my_avatar", { p_avatar_url: avatarUrl });
  if (error) return fail(messageOf(error));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(oldPassword, newPassword) {
  const { supabase, user } = await requireUser();
  if (!user) return fail(SESSION_ENDED);

  if (!PASSWORD_RULE.test(String(newPassword ?? ""))) {
    return fail("Kata sandi baru minimal 8 karakter, kombinasi huruf dan angka.");
  }
  if (newPassword === oldPassword) return fail("Kata sandi baru harus berbeda dari yang lama.");
  if (!(await passwordOk(supabase, user.email, oldPassword))) return fail("Kata sandi lama salah.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("[changePassword]", error.message);
    return fail(
      error.code === "same_password"
        ? "Kata sandi baru harus berbeda dari yang lama."
        : "Gagal memperbarui kata sandi. Coba lagi."
    );
  }

  await supabase.auth.signOut({ scope: "others" }); // perangkat lain dikeluarkan
  return { ok: true };
}

/** Langkah 1: kirim kode ke email lama dan baru (Secure email change aktif). */
export async function requestEmailChange(newEmail, password) {
  const { supabase, user } = await requireUser();
  if (!user) return fail(SESSION_ENDED);

  const email = String(newEmail ?? "").trim().toLowerCase();
  if (!EMAIL_RULE.test(email)) return fail("Format email tidak valid.");
  if (email === user.email?.toLowerCase()) return fail("Email baru sama dengan email saat ini.");
  if (!(await passwordOk(supabase, user.email, password))) return fail("Kata sandi salah.");

  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    console.error("[requestEmailChange]", error.code, error.message);
    if (error.code === "email_exists") return fail("Email sudah dipakai akun lain.");
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return fail("Terlalu sering meminta kode. Tunggu 30 detik, lalu coba lagi.");
    }
    return fail("Gagal mengirim kode. Coba lagi.");
  }
  return { ok: true };
}

/** Langkah 2: verifikasi kode dari email lama dan email baru. */
export async function verifyEmailChange(newEmail, codeNew, codeCurrent) {
  const { supabase, user } = await requireUser();
  if (!user) return fail(SESSION_ENDED);

  const email = String(newEmail ?? "").trim().toLowerCase();
  const tokenNew = digits(codeNew);
  const tokenCurrent = digits(codeCurrent);
  if (tokenNew.length !== 6) return fail("Masukkan kode 6 digit dari email baru.");
  if (tokenCurrent && tokenCurrent.length !== 6) return fail("Kode dari email lama harus 6 digit.");

  if (tokenCurrent) {
    const { error } = await supabase.auth.verifyOtp({
      email: user.email,
      token: tokenCurrent,
      type: "email_change",
    });
    if (error) return fail("Kode dari email lama salah atau kedaluwarsa.");
  }
  const { error } = await supabase.auth.verifyOtp({ email, token: tokenNew, type: "email_change" });
  if (error) return fail("Kode dari email baru salah atau kedaluwarsa.");

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Berhasil: Ketua lama diarahkan ke /home (tidak lagi punya akses dashboard). */
export async function transferLeadership(newLeaderId, password) {
  const { supabase, user } = await requireUser();
  if (!user) return fail(SESSION_ENDED);
  if (!(await passwordOk(supabase, user.email, password))) return fail("Kata sandi salah.");

  const { error } = await supabase.rpc("change_leader", { p_new_leader: newLeaderId });
  if (error) return fail(messageOf(error));

  revalidatePath("/", "layout");
  redirect("/home");
}

/** Dipakai zona publik. Ketua tidak bisa menghapus akun selama masih menjabat. */
export async function deleteMyAccount(password, confirmText) {
  const { supabase, user } = await requireUser();
  if (!user) return fail(SESSION_ENDED);

  if (String(confirmText ?? "").trim() !== "HAPUS") return fail('Ketik "HAPUS" untuk konfirmasi.');
  if (!(await passwordOk(supabase, user.email, password))) return fail("Kata sandi salah.");

  const { data: led } = await supabase
    .from("pkk_members")
    .select("pkk_unit_id")
    .eq("user_id", user.id)
    .eq("member_role", "leader")
    .limit(1)
    .maybeSingle();

  if (led) {
    const { count } = await supabase
      .from("pkk_members")
      .select("pkk_member_id", { count: "exact", head: true })
      .eq("pkk_unit_id", led.pkk_unit_id)
      .neq("user_id", user.id)
      .eq("status", "verified");
    return fail(
      count > 0
        ? "Anda masih menjabat sebagai Ketua. Serahkan jabatan terlebih dahulu."
        : "Anda satu-satunya anggota unit PKK ini, sehingga akun Ketua tidak dapat dihapus."
    );
  }

  const admin = createAdminClient();
  try {
    const { data: files } = await admin.storage.from("avatars").list(user.id);
    if (files?.length) {
      await admin.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch (e) {
    console.error("[deleteMyAccount] foto:", e?.message);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteMyAccount]", error.message);
    return fail("Akun gagal dihapus. Coba lagi atau hubungi pengelola.");
  }

  try {
    await supabase.auth.signOut();
  } catch {}
  revalidatePath("/", "layout");
  return { ok: true };
}