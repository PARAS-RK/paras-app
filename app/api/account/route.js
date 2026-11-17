import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function DELETE(request) {
  try {
    // ID diambil dari sesi, bukan dari body request
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verifikasi konfirmasi di server: email akun (atau "HAPUS" bila akun tanpa email)
    const body = await request.json().catch(() => ({}));
    const expected = (user.email || 'HAPUS').trim().toLowerCase();
    const given = String(body?.confirm || '')
      .trim()
      .toLowerCase();
    if (given !== expected) {
      return NextResponse.json({ error: 'Konfirmasi tidak cocok.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('DELETE /api/account:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
