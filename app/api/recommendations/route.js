import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Pesan diperlukan" }, { status: 400 });
    }

    // 1. Kirim laporan ke FastAPI Python backend
    const fastapiUrl = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${fastapiUrl}/api/recommend-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const aiData = await response.json();
    if (!response.ok) throw new Error(aiData.detail || "Gagal memproses AI");

    // 2. Inisialisasi Supabase Admin Client di server-side
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Simpan output AI ke tabel manajemen aksi Supabase
    const { error: dbError } = await supabase.from("community_actions").insert({
      session_id: sessionId || crypto.randomUUID(),
      laporan_warga: message,
      rekomendasi_kegiatan: aiData.rekomendasi_kegiatan,
      panduan_sop: aiData.panduan_sop,
      status: "Pending", // Masuk ke antrean admin manajemen aksi
    });

    if (dbError) {
      console.error("Gagal simpan ke Supabase:", dbError);
    }

    return NextResponse.json({ success: true, data: aiData });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}