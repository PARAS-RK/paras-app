"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";


export async function login(formData) {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/favorites");
}

export async function login(formData) {
    const supabase = await createClient();

    const phone = formData.get("phone");
    const password = formData.get("password");

    const { error } = await supabase.auth.signInWithPassword({
        phone,
        password,
    });

    if (error) {
        redirect(`/error?message=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/", "layout");
    redirect("/favorites");
}

// FUNGSI BARU UNTCRIPT SIGN IN GOOGLE
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Pastikan URL ini sesuai dengan konfigurasi callback kamu
      redirectTo: `http://localhost:3000/auth/callback`, 
    },
  });

  if (error) {
    redirect(`/error?message=${encodeURIComponent("Gagal login dengan Google")}`);
  }

  if (data.url) {
    // Redirect user ke halaman consent Google
    redirect(data.url);
  }
}