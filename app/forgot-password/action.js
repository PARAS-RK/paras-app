'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// Mengirim email berisi TAUTAN reset kata sandi.
// Tautan mengarah ke {redirectTo}?token_hash=...&type=recovery&next=/reset-password
// (template "Reset password" di Supabase memakai {{ .RedirectTo }} dan {{ .TokenHash }}).
export async function requestPasswordReset(email) {
  if (!email || typeof email !== 'string') {
    return { success: false, error: 'Email tidak valid.' };
  }

  const h = await headers();
  const origin = h.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/auth/confirm`,
  });

  if (error) {
    // Email yang tidak terdaftar TIDAK menghasilkan error (Supabase merahasiakannya)
    const rateLimited = /rate limit|seconds|too many/i.test(error.message);
    return {
      success: false,
      error: rateLimited ? 'Terlalu sering meminta tautan. Tunggu sebentar lalu coba lagi.' : error.message,
    };
  }

  return { success: true };
}
