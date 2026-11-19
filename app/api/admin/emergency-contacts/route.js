import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/admin";

export async function GET(request) {
  try {
    // Validasi sesi Ketua PKK
    const { admin } = await checkAdmin();

    if (!admin?.userId || !admin?.regionId) {
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
      "other",
      "pln",
      "sar",
      "darurat"
    ];

    if (agencyType && !allowedTypes.includes(agencyType)) {
      return NextResponse.json(
        { error: "Jenis instansi tidak valid." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let query = supabase
      .from("emergency_contacts")
      .select("id, agency_type, agency_name, phone_number, notes")
      .eq("region_id", admin.regionId)
      .eq("is_active", true)
      .order("agency_type", { ascending: true })
      .order("agency_name", { ascending: true });

    if (agencyType) query = query.eq("agency_type", agencyType);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      contacts: data ?? []
    });

  } catch (error) {
    console.error("Emergency contacts fetch error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil kontak darurat." },
      { status: 500 }
    );
  }
}