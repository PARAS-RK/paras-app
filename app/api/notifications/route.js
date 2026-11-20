import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

async function getUser(supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return error || !user ? null : user;
}

// GET Notif
export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [listRes, countRes] = await Promise.all([
      supabase.from('notifications').select('notif_id, notif_content, notif_type, read_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
    ]);

    if (listRes.error) {
      console.error('GET /api/notifications error:', listRes.error);
      return NextResponse.json({ error: listRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: listRes.data ?? [],
      unreadCount: countRes.count ?? 0,
    });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: tandai dibaca. Body: { id } untuk satu notifikasi, { all: true } untuk semua
export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));

    let query = supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);

    if (body.all !== true) {
      if (!Number.isInteger(body.id)) {
        return NextResponse.json({ error: 'id tidak valid' }, { status: 400 });
      }
      query = query.eq('notif_id', body.id);
    }

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/notifications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: hapus. Body: { id } untuk satu notifikasi, { all: true } untuk semua milik user
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));

    let query = supabase.from('notifications').delete().eq('user_id', user.id);

    if (body.all !== true) {
      if (!Number.isInteger(body.id)) {
        return NextResponse.json({ error: 'id tidak valid' }, { status: 400 });
      }
      query = query.eq('notif_id', body.id);
    }

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/notifications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
