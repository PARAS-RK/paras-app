import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

const ADMIN_CATEGORY = "anggota_pkk"; // profiles.account_category
const ACTIVE_STATUS = "active"; // profiles.account_status
const LEADER_ROLE = "leader"; // pkk_members.member_role
const MEMBER_VERIFIED = "verified"; // pkk_members.status
const UNIT_VERIFIED = "verified"; // pkk_units.verification_status

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

function initialsOf(name) {
  return name
    .replace(/^(Ibu|Bapak|Mbak)\s+/, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function dbError(step, error) {
  console.error(`[checkAdmin] ${step}:`, error.message);
  return { reason: "db_error" };
}

/** Mengembalikan { admin } kalau boleh masuk dashboard, atau { reason } kalau ditolak. */
export async function checkAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { reason: "not_logged_in" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, phone_number, avatar_url, account_category, account_status, rt, rw")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) return dbError("profiles", profileError);
  if (!profile || profile.account_category !== ADMIN_CATEGORY) return { reason: "not_admin" };
  if (profile.account_status !== ACTIVE_STATUS) return { reason: "inactive" };

  const { data: membership, error: membershipError } = await supabase
    .from("pkk_members")
    .select("pkk_member_id, pkk_unit_id, member_role, status, joined_at")
    .eq("user_id", user.id)
    .eq("member_role", LEADER_ROLE)
    .limit(1)
    .maybeSingle();
  if (membershipError) return dbError("pkk_members", membershipError);
  if (!membership) return { reason: "not_admin" };
  if (membership.status !== MEMBER_VERIFIED) return { reason: "leader_pending" };

  const { data: unit, error: unitError } = await supabase
    .from("pkk_units")
    .select("pkk_unit_id, region_id, unit_name, verification_status")
    .eq("pkk_unit_id", membership.pkk_unit_id)
    .maybeSingle();
  if (unitError) return dbError("pkk_units", unitError);
  if (!unit) return { reason: "no_unit" };
  if (unit.verification_status !== UNIT_VERIFIED) return { reason: "unverified" };

  const { data: region, error: regionError } = await supabase
    .from("regions")
    .select("district, subdistrict")
    .eq("region_id", unit.region_id)
    .maybeSingle();
  if (regionError) return dbError("regions", regionError);

  // Jumlah anggota terverifikasi (tidak fatal kalau gagal)
  const { count } = await supabase
    .from("pkk_members")
    .select("pkk_member_id", { count: "exact", head: true })
    .eq("pkk_unit_id", unit.pkk_unit_id)
    .eq("status", MEMBER_VERIFIED);

  const name = profile.full_name || user.email;
  const areaLabel = region?.subdistrict ? `Kel. ${region.subdistrict}` : unit.unit_name;

  return {
    admin: {
      userId: user.id,
      name,
      initials: initialsOf(name),
      email: user.email,
      phone: profile.phone_number,
      avatarUrl: profile.avatar_url,
      rt: profile.rt ?? "",
      rw: profile.rw ?? "",
      joined: membership.joined_at ? dateFormat.format(new Date(membership.joined_at)) : "-",
      memberCount: count ?? 0,
      unitId: unit.pkk_unit_id,
      unitName: unit.unit_name,
      regionId: unit.region_id,
      district: region?.district ?? "",
      areaLabel,
      areaFull: region
        ? `Kelurahan ${region.subdistrict}, Kec. ${region.district}`
        : unit.unit_name,
    },
  };
}

// Admin atau null. cache(): layout dan page dalam satu permintaan hanya query sekali.
export const getAdminSession = cache(async () => {
  const { admin } = await checkAdmin();
  return admin ?? null;
});