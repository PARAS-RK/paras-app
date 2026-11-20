import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

const IN_PROGRESS = ['submitted', 'in_review', 'in_progress'];

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name, rt, rw, regions(province, city, district, subdistrict)').eq('user_id', user.id).maybeSingle();

    if (profileError) {
      console.error('GET /api/home profile error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const region = profile?.regions ?? null;
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || profile?.full_name || user.email?.split('@')[0] || 'Warga PARAS';
    const areaFull = region ? `${profile.rt && profile.rw ? `RT ${profile.rt}/RW ${profile.rw}, ` : ''}Kel. ${region.subdistrict}, ${region.city}` : null;

    const [reportsRes, partRes] = await Promise.all([
      supabase.from('reports').select('report_status').eq('user_id', user.id),
      supabase
        .from('action_participants')
        .select('participation_id, action_id, leaderboard_point, joined_at, completed_at, community_actions(action_id, action_title, action_status)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false }),
    ]);

    const reports = reportsRes.data ?? [];
    const parts = partRes.data ?? [];

    // Aksi aktif: terakhir diikuti, belum selesai, aksinya masih open/ongoing
    const activePart = parts.find((p) => !p.completed_at && ['open', 'ongoing'].includes(p.community_actions?.action_status));

    let activeAction = null;
    if (activePart) {
      const [totalRes, doneRes] = await Promise.all([
        supabase.from('action_tasks').select('*', { count: 'exact', head: true }).eq('action_id', activePart.action_id),
        supabase.from('action_task_progress').select('*', { count: 'exact', head: true }).eq('participation_id', activePart.participation_id),
      ]);
      const target = totalRes.count ?? 0;
      const achieved = doneRes.count ?? 0;
      activeAction = {
        id: activePart.action_id,
        title: activePart.community_actions.action_title,
        target,
        achieved,
        isDone: target > 0 && achieved >= target,
      };
    }

    return NextResponse.json({
      displayName,
      areaFull,
      region,
      stats: {
        points: parts.reduce((sum, p) => sum + Number(p.leaderboard_point ?? 0), 0),
        completedCount: parts.filter((p) => p.completed_at).length,
        activeAction,
        reportsTotal: reports.length,
        reportsInProgress: reports.filter((r) => IN_PROGRESS.includes(r.report_status)).length,
      },
    });
  } catch (err) {
    console.error('GET /api/home error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
