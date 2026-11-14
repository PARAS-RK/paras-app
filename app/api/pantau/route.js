import { NextResponse } from 'next/server';
import { COMMUNITY_HIDDEN_STATUSES, REPORT_LIST_SELECT, STATUS_GROUPS, getPantauContext, mapReport, sanitizeSearch } from '@/lib/pantau-server';

const PAGE_SIZE = 10;
const MAX_PAGE = 500;
const PRIVATE = { headers: { 'Cache-Control': 'private, no-store' } };

const fail = (error, status) => NextResponse.json({ error }, { status });

export async function GET(request) {
  try {
    const ctx = await getPantauContext();
    if (!ctx) return fail('Silakan masuk terlebih dahulu', 401);

    const params = new URL(request.url).searchParams;
    const scope = params.get('scope') === 'community' ? 'community' : 'mine';
    const status = params.get('status') ?? 'all';
    const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1));
    const q = sanitizeSearch(params.get('q'));

    if (status !== 'all' && !STATUS_GROUPS[status]) return fail('Filter status tidak valid', 400);

    if (scope === 'community' && !ctx.canSeeCommunity) {
      return NextResponse.json(
        {
          items: [],
          page,
          pageSize: PAGE_SIZE,
          total: 0,
          hasMore: false,
          notice: ctx.regionId ? 'blocked' : 'no_region',
        },
        PRIVATE,
      );
    }

    let query = ctx.admin.from('reports').select(REPORT_LIST_SELECT, { count: 'exact' });

    if (scope === 'mine') {
      query = query.eq('user_id', ctx.user.id);
    } else {
      query = query
        .eq('region_id', ctx.regionId)
        .neq('user_id', ctx.user.id)
        .not('report_status', 'in', `(${COMMUNITY_HIDDEN_STATUSES.join(',')})`);
    }

    if (status !== 'all') query = query.in('report_status', STATUS_GROUPS[status]);
    if (q) query = query.or(`ticket_code.ilike.%${q}%,report_description.ilike.%${q}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .order('report_id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error?.code === 'PGRST103') {
      return NextResponse.json({ items: [], page, pageSize: PAGE_SIZE, total: count ?? 0, hasMore: false }, PRIVATE);
    }
    if (error) throw error;

    const rows = data ?? [];

    // Laporan mana saja yang sudah didukung pengguna
    let voted = new Set();
    if (rows.length) {
      const { data: votes, error: votesError } = await ctx.admin
        .from('report_votes')
        .select('report_id')
        .eq('user_id', ctx.user.id)
        .in(
          'report_id',
          rows.map((r) => r.report_id),
        );
      if (votesError) throw votesError;
      voted = new Set((votes ?? []).map((v) => v.report_id));
    }

    const items = rows.map((row) => ({ ...mapReport(row, ctx), hasVoted: voted.has(row.report_id) }));
    const total = count ?? items.length;

    return NextResponse.json({ items, page, pageSize: PAGE_SIZE, total, hasMore: from + items.length < total }, PRIVATE);
  } catch (err) {
    console.error('[GET /api/pantau]', err);
    return fail('Terjadi kesalahan server', 500);
  }
}
