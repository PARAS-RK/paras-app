import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Validasi akses khusus notebook AI
function authorize(request) {
  const apiKey = request.headers.get("x-paras-ai-key");
  const expectedKey = process.env.PARAS_AI_API_KEY;

  return Boolean(expectedKey && apiKey && apiKey === expectedKey);
}

// GET: Mengambil laporan yang belum memiliki penilaian AI
export async function GET(request) {
  try {
    if (!authorize(request)) {
      return NextResponse.json(
        { error: "Akses AI ditolak." },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const { data: reports, error: reportError } = await supabase
      .from("reports")
      .select(`
        report_id,
        ticket_code,
        report_description,
        report_status,
        created_at,
        user_id,
        region_id,
        report_category,
        location_detail
      `)
      .order("created_at", { ascending: true })
      .limit(500);

    if (reportError) throw reportError;

    const reportIds = (reports ?? []).map(
      (report) => report.report_id
    );

    if (!reportIds.length) {
      return NextResponse.json({ reports: [] });
    }

    const { data: assessments, error: assessmentError } =
      await supabase
        .from("report_ai_assessments")
        .select("report_id")
        .in("report_id", reportIds);

    if (assessmentError) throw assessmentError;

    const assessedIds = new Set(
      (assessments ?? []).map((item) => String(item.report_id))
    );

    const pendingReports = reports.filter(
      (report) => !assessedIds.has(String(report.report_id))
    );

    return NextResponse.json({
      reports: pendingReports
    });

  } catch (error) {
    console.error("PARAS AI fetch error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil laporan." },
      { status: 500 }
    );
  }
}

// POST: Menyimpan hasil penilaian AI
export async function POST(request) {
  try {
    if (!authorize(request)) {
      return NextResponse.json(
        { error: "Akses AI ditolak." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const assessments = body.assessments;

    if (!Array.isArray(assessments) || !assessments.length) {
      return NextResponse.json(
        { error: "Data penilaian tidak valid." },
        { status: 400 }
      );
    }

    const rows = assessments.map((item) => ({
      report_id: item.report_id,
      predicted_category: item.predicted_category,
      urgency_score: item.urgency_score,
      urgency_level: item.urgency_level,
      feature_scores: item.feature_scores ?? {},
      model_name: item.model_name,
      prompt_version: item.prompt_version
    }));

    const valid = rows.every((item) =>
      item.report_id != null &&
      typeof item.predicted_category === "string" &&
      Number.isInteger(item.urgency_score) &&
      typeof item.urgency_level === "string"
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Ada data penilaian yang tidak lengkap." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("report_ai_assessments")
      .insert(rows)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      saved: data.length
    });

  } catch (error) {
    console.error("PARAS AI save error:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan penilaian AI." },
      { status: 500 }
    );
  }
}