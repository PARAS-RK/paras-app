"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData) {
  const supabase = await createClient();

  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const password = formData.get("password");
  const province = formData.get("province");
  const city = formData.get("city");
  const kecamatan = formData.get("kecamatan");
  const kelurahan = formData.get("kelurahan");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        email,
        phone,
        province,
        city,
        kecamatan,
        kelurahan,
      },
    },
  });

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(
    `/login?message=${encodeURIComponent("Sign up berhasil! Silakan login.")}`
  );
}