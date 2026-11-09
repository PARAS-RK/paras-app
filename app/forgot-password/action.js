"use server";

import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(email) {
  const supabase = await createClient();

  if (!email || typeof email !== "string") {
    return { success: false, error: "Email tidak valid." };
  }

  const cleanEmail = email.trim();

  // Kirim link reset kata sandi dari Supabase Auth
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}