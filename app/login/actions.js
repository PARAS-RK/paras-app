'use server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const GENERIC_EMAIL = 'Email atau kata sandi salah.';
const GENERIC_PHONE = 'Nomor HP atau kata sandi salah.';
const SERVER_ERROR = 'Terjadi kesalahan pada server. Coba lagi.';
const NOT_CONFIRMED = 'Email Anda belum diverifikasi. Selesaikan pendaftaran lebih dulu.';

const isText = (v) => typeof v === 'string' && v.trim() !== '';

export async function loginWithEmail({ email, password } = {}) {
  if (!isText(email) || typeof password !== 'string' || !password) {
    return { error: GENERIC_EMAIL };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (/not confirmed/i.test(error.message)) return { error: NOT_CONFIRMED };
      return { error: GENERIC_EMAIL };
    }
    return { ok: true };
  } catch (err) {
    console.error('loginWithEmail error:', err);
    return { error: SERVER_ERROR };
  }
}

export async function loginWithPhone({ phone, password } = {}) {
  if (!isText(phone) || typeof password !== 'string' || !password) {
    return { error: GENERIC_PHONE };
  }

  try {
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: email, error: lookupError } = await admin.rpc('find_email_by_phone', { p_phone: phone });
    if (lookupError) {
      console.error('loginWithPhone lookup error:', lookupError);
      return { error: SERVER_ERROR };
    }
    if (!email) return { error: GENERIC_PHONE };

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/not confirmed/i.test(error.message)) return { error: NOT_CONFIRMED };
      return { error: GENERIC_PHONE };
    }
    return { ok: true };
  } catch (err) {
    console.error('loginWithPhone error:', err);
    return { error: SERVER_ERROR };
  }
}
