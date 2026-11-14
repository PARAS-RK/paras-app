import { NextResponse } from 'next/server';
import { HANDLER_BY_ROUTE, REPORT_LIST_SELECT, getPantauContext, getViewableReport, mapReport, parseReportId, toUiStatus } from '@/lib/pantau-server';

const BUCKET = 'bukti-laporan';
const SIGNED_URL_TTL = 60 * 60; // detik
const PRIVATE = { headers: { 'Cache-Control': 'private, no-store' } };

const fail = (error, status) => NextResponse.json({ error }, { status });
const notFound = () => fail('Laporan tidak ditemukan', 404);

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const reportId = parseReportId(id);
    if (!reportId) return notFound();

    const ctx = await getPantauContext();
    if (!ctx) return fail('Silakan masuk terlebih dahulu', 401);

    const row = await getViewableReport(ctx, reportId, REPORT_LIST_SELECT);
    if (!row) return notFound();

    const report = mapReport(row, ctx);
    const noRows = { data: [], error: null };

    const [logsRes, reviewRes, mediaRes, votedRes] = await Promise.all([
      // Hanya log publik; catatan internal admin tidak pernah dikirim ke warga.
      ctx.admin.from('report_status_logs').select('log_status, log_notes, created_at').eq('report_id', reportId).eq('is_public', true).order('log_id', { ascending: false }),
      ctx.admin.from('report_admin_reviews').select('handling_route, review_decision').eq('report_id', reportId).maybeSingle(),
      // Foto bukti hanya untuk pelapor
      report.isMine ? ctx.admin.from('reports_media').select('path_storage, file_type, number_file').eq('report_id', reportId).order('number_file', { ascending: true }) : Promise.resolve(noRows),
      ctx.admin.from('report_votes').select('report_id').eq('report_id', reportId).eq('user_id', ctx.user.id).maybeSingle(),
    ]);

    for (const res of [logsRes, reviewRes, mediaRes, votedRes]) {
      if (res.error) throw res.error;
    }

    const logs = logsRes.data ?? [];
    const currentLog = logs.find((l) => l.log_status === row.report_status);
    const publicMessage = currentLog?.log_notes ?? null;

    const review = reviewRes.data;
    const handledBy = review && review.review_decision !== 'rejected' ? (HANDLER_BY_ROUTE[review.handling_route] ?? null) : null;

    let media = [];
    const images = (mediaRes.data ?? []).filter((m) => m.file_type === 'image');
    if (images.length) {
      const { data: signed, error: signError } = await ctx.admin.storage.from(BUCKET).createSignedUrls(
        images.map((m) => m.path_storage),
        SIGNED_URL_TTL,
      );
      if (signError) console.error('[GET /api/pantau/:id] signed url', signError);
      else media = (signed ?? []).filter((s) => s.signedUrl && !s.error).map((s) => ({ url: s.signedUrl }));
    }

    return NextResponse.json(
      {
        report: {
          ...report,
          details: row.report_description,
          handledBy,
          publicMessage,
          rejectionReason: row.report_status === 'rejected' ? publicMessage : null,
          timeline: [...logs].reverse().map((l) => ({
            status: toUiStatus(l.log_status),
            note: l.log_notes,
            createdAt: l.created_at,
          })),
          media,
          hasVoted: Boolean(votedRes.data),
        },
      },
      PRIVATE,
    );
  } catch (err) {
    console.error('[GET /api/pantau/:id]', err);
    return fail('Terjadi kesalahan server', 500);
  }
}
