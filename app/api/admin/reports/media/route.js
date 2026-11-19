import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";


export async function GET() {
  try {
    // Validasi sesi dan hak akses Ketua PKK
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json(
        { error: "Akses admin ditolak." },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const regionId = adminSession.regionId;

    // Ambil ID laporan yang berada di wilayah admin
    const { data: reports, error: reportError } = await supabase
      .from("reports")
      .select("report_id")
      .eq("region_id", regionId);

    if (reportError) throw reportError;

    const reportIds = (reports ?? []).map((report) => report.report_id);

    if (reportIds.length === 0) {
      return NextResponse.json({ media: [] });
    }

    // Ambil metadata foto dari reports_media
    const { data: mediaRows, error: mediaError } = await supabase
      .from("reports_media")
      .select("report_id, path_storage, file_type, number_file")
      .in("report_id", reportIds)
      .eq("file_type", "image")
      .order("number_file", { ascending: true });

    if (mediaError) throw mediaError;

    if (!mediaRows?.length) {
      return NextResponse.json({ media: [] });
    }

    // Buat signed URL dalam batch
    const media = [];

    for (let i = 0; i < mediaRows.length; i += 100) {
      const batch = mediaRows.slice(i, i + 100);

      const { data: signedRows, error: signedError } =
        await supabase.storage
          .from("bukti-laporan")
          .createSignedUrls(
            batch.map((item) => item.path_storage),
            60 * 60
          );

      if (signedError) throw signedError;

      (signedRows ?? []).forEach((signed, index) => {
        if (signed.signedUrl) {
          media.push({
            report_id: batch[index].report_id,
            path_storage: batch[index].path_storage,
            number_file: batch[index].number_file,
            url: signed.signedUrl,
          });
        }
      });
    }

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Admin report media error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil foto laporan." },
      { status: 500 }
    );
  }
}