'use server';

import { createClient } from '@/lib/supabase/server';

export async function requestPasswordReset(email) {
  if (!email || typeof email !== 'string') {
    return {
      success: false,
      error: 'Email tidak valid.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null);

  if (!siteUrl) {
    return {
      success: false,
      error: 'Konfigurasi URL aplikasi belum tersedia.',
    };
  }

  const redirectTo = new URL('/auth/confirm', siteUrl).toString();

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  if (error) {
    const rateLimited = /rate limit|seconds|too many/i.test(error.message);

    return {
      success: false,
      error: rateLimited ? 'Terlalu sering meminta tautan. Tunggu sebentar lalu coba lagi.' : error.message,
    };
  }

  return { success: true };
}
