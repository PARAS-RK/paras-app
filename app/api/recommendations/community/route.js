import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const message = body?.message?.trim();
    const sessionId = body?.sessionId;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Pesan laporan diperlukan." },
        { status: 400 }
      );
    }

    const fastapiUrl = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000";

    // Timeout 20 detik agar tidak menggantung selamanya jika backend cold-start / lambat
    const response = await fetch(`${fastapiUrl}/recommendations/community`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report: message, top_k: 2 }),
      signal: AbortSignal.timeout(20000),
    });

    const rawText = await response.text();
    let aiResponse = {};
    try {
      aiResponse = rawText ? JSON.parse(rawText) : {};
    } catch {
      throw new Error("Respons dari layanan AI bukan JSON yang valid.");
    }

    if (!response.ok) {
      throw new Error(aiResponse.detail || aiResponse.error || "Gagal memproses AI.");
    }

    const results = Array.isArray(aiResponse.results) ? aiResponse.results : [];
    const rekomendasiKegiatan = results
      .map((item) => item?.kegiatan)
      .filter(Boolean)
      .join("\n");
    const panduanSop = aiResponse.text || aiResponse.panduan_sop || "";

    const aiData = {
      rekomendasi_kegiatan: rekomendasiKegiatan,
      panduan_sop: panduanSop,
      results,
    };

    // Simpan ke Supabase jika env tersedia
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    let savedToDb = false;
    let dbWarning = null;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error: dbError } = await supabase.from("community_actions").insert({
        session_id: sessionId || crypto.randomUUID(),
        laporan_warga: message,
        rekomendasi_kegiatan: aiData.rekomendasi_kegiatan,
        panduan_sop: aiData.panduan_sop,
        status: "Pending",
      });

      if (dbError) {
        console.error("Gagal simpan ke Supabase:", dbError);
        dbWarning = dbError.message;
      } else {
        savedToDb = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: aiData,
      meta: { savedToDb, dbWarning },
    });
  } catch (error) {
    const isTimeout =
      error?.name === "TimeoutError" || error?.name === "AbortError";

    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? "Layanan AI merespons terlalu lama. Coba kirim ulang beberapa saat lagi."
          : error.message || "Terjadi kesalahan pada server.",
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}