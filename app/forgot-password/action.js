'use server';

import { createClient } from '@/lib/supabase/server';

export async function requestPasswordReset(email) {
  if (!email || typeof email !== 'string') {
    return {
      success: false,
      error: 'Email tidak valid.',
    };
  }

  const siteUrl = process.env.SITE_URL;

  if (!siteUrl) {
    console.error('SITE_URL belum dikonfigurasi');

    return {
      success: false,
      error: 'Konfigurasi URL aplikasi belum tersedia.',
    };
  }

  const redirectTo = new URL('/auth/confirm', siteUrl).toString();

  console.log('[PASSWORD RESET] Redirect:', redirectTo);

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

  if (error) {
    const rateLimited = /rate limit|seconds|too many/i.test(error.message);

    return {
      success: false,
      error: rateLimited ? 'Terlalu sering meminta tautan. Tunggu sebentar lalu coba lagi.' : error.message,
    };
  }

  return { success: true };
}
