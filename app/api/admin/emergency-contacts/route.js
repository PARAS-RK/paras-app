import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/admin";

export async function GET(request) {
  try {
    // Validasi sesi Ketua PKK
    const { admin } = await checkAdmin();
    console.log("HASIL CHECK ADMIN:", admin);

    if (!admin?.userId || !admin?.regionID) {
      return NextResponse.json(
        { error: "Akses admin ditolak." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agencyType = searchParams.get("agency_type");

    const allowedTypes = [
      "bpbd",
      "damkar",
      "ambulance",
      "police",
      "other"
    ];

    if (!agencyType || !allowedTypes.includes(agencyType)) {
      return NextResponse.json(
        { error: "Jenis instansi tidak valid." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("agency_type, agency_name, phone_number")
      .eq("region_id", admin.regionID)
      .eq("agency_type", agencyType)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      contact: data ?? null
    });

  } catch (error) {
    console.error("Emergency contacts fetch error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil kontak darurat." },
      { status: 500 }
    );
  }
}