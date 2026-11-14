import { NextResponse } from 'next/server';
import { getPantauContext, getViewableReport, parseReportId } from '@/lib/pantau-server';

const fail = (error, status) => NextResponse.json({ error }, { status });

async function handle(params, action) {
  try {
    const { id } = await params;
    const reportId = parseReportId(id);
    if (!reportId) return fail('Laporan tidak ditemukan', 404);

    const ctx = await getPantauContext();
    if (!ctx) return fail('Silakan masuk terlebih dahulu', 401);

    const row = await getViewableReport(ctx, reportId, 'report_id, user_id, region_id, report_status');
    if (!row) return fail('Laporan tidak ditemukan', 404);

    if (row.user_id === ctx.user.id) {
      return fail('Anda tidak dapat mendukung laporan Anda sendiri', 400);
    }

    if (action === 'add') {
      const { error } = await ctx.admin.from('report_votes').upsert({ report_id: reportId, user_id: ctx.user.id }, { onConflict: 'report_id,user_id', ignoreDuplicates: true });
      if (error) throw error;
    } else {
      const { error } = await ctx.admin.from('report_votes').delete().eq('report_id', reportId).eq('user_id', ctx.user.id);
      if (error) throw error;
    }

    const { count, error: countError } = await ctx.admin.from('report_votes').select('report_id', { count: 'exact', head: true }).eq('report_id', reportId);
    if (countError) throw countError;

    return NextResponse.json({ hasVoted: action === 'add', voteCount: count ?? 0 });
  } catch (err) {
    console.error(`[${action === 'add' ? 'POST' : 'DELETE'} /api/pantau/:id/dukung]`, err);
    return fail('Terjadi kesalahan server', 500);
  }
}

export async function POST(_request, { params }) {
  return handle(params, 'add');
}

export async function DELETE(_request, { params }) {
  return handle(params, 'remove');
}
