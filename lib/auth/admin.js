import { createClient } from "@/lib/supabase/server";

const ADMIN_CATEGORY = "anggota_pkk"; // profiles.account_category
const ACTIVE_STATUS = "active"; // profiles.account_status
const LEADER_ROLE = "leader"; // pkk_members.member_role
const VERIFIED_STATUS = "verified"; // pkk_units.verification_status

function initialsOf(name) {
  return name
    .replace(/^(Ibu|Bapak|Mbak)\s+/, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Mengembalikan { admin } kalau akun boleh masuk dashboard,
 * atau { reason } kalau ditolak (dipakai untuk pesan di halaman login).
 */
export async function checkAdmin() {
  const supabase = await createClient();

  // getUser() memverifikasi ke server Supabase (lebih aman daripada getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { reason: "not_logged_in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone_number, avatar_url, account_category, account_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.account_category !== ADMIN_CATEGORY) return { reason: "not_admin" };
  if (profile.account_status !== ACTIVE_STATUS) return { reason: "inactive" };

  // Hanya Ketua (leader) yang boleh masuk dashboard admin
  const { data: membership } = await supabase
    .from("pkk_members")
    .select("pkk_member_id, pkk_unit_id, member_role, joined_at")
    .eq("user_id", user.id)
    .eq("member_role", LEADER_ROLE)
    .limit(1)
    .maybeSingle();
  if (!membership) return { reason: "not_admin" };

  const { data: unit } = await supabase
    .from("pkk_units")
    .select("pkk_unit_id, region_id, unit_name, pkk_code_area, verification_status")
    .eq("pkk_unit_id", membership.pkk_unit_id)
    .maybeSingle();
  if (!unit) return { reason: "no_unit" };
  if (unit.verification_status !== VERIFIED_STATUS) return { reason: "unverified" };

  const { data: region } = await supabase
    .from("regions")
    .select("city, district, subdistrict")
    .eq("region_id", unit.region_id)
    .maybeSingle();

  const name = profile.full_name || user.email;
  const areaLabel = region?.subdistrict ? `Kel. ${region.subdistrict}` : unit.unit_name;
  const areaFull = region
    ? `Kelurahan ${region.subdistrict}, Kec. ${region.district}`
    : unit.unit_name;

  return {
    admin: {
      userId: user.id,
      name,
      initials: initialsOf(name),
      email: user.email,
      phone: profile.phone_number,
      avatarUrl: profile.avatar_url,
      unitId: unit.pkk_unit_id,
      unitName: unit.unit_name,
      areaLabel,
      areaFull,
    },
  };
}

// Versi ringkas: admin atau null
export async function getAdminSession() {
  const { admin } = await checkAdmin();
  return admin ?? null;
}