'use server';

import { createClient } from '../../../lib/supabase/server';

export async function getProfileData(userId) {
  const supabase = createClient();
  const { data, error } = await supabase.from('profiles').select('*, regions(*)').eq('user_id', userId).single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfileServer(formData) {
  try {
    const supabase = createClient();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
