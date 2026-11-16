import "server-only";
import { createClient } from "@/lib/supabase/server";

const PROFILE_COLS =
  "user_id, full_name, phone_number, account_category, account_status, rt, rw, region_id, created_at, status_reason";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : "-");
const toMs = (value) => (value ? new Date(value).getTime() : null);

function addressOf(profile, areaLabel) {
  const rtrw = [profile.rt && `RT ${profile.rt}`, profile.rw && `RW ${profile.rw}`]
    .filter(Boolean)
    .join(" / ");
  return rtrw ? `${rtrw}, ${areaLabel}` : areaLabel;
}

/** Mengembalikan { users, registrations, error } untuk unit dan kelurahan milik admin. */
export async function getManagedUsers(admin) {
  const supabase = await createClient();
  const fail = (step, error) => {
    console.error(`[getManagedUsers] ${step}:`, error.message);
    return {
      users: [],
      registrations: [],
      error: "Data pengguna gagal dimuat. Coba muat ulang halaman.",
    };
  };

  const { data: members, error: membersError } = await supabase
    .from("pkk_members")
    .select("user_id, member_role, status, joined_at")
    .eq("pkk_unit_id", admin.unitId);
  if (membersError) return fail("pkk_members", membersError);

  const memberIds = members.map((m) => m.user_id);
  const [memberProfiles, residents, emails, actions] = await Promise.all([
    memberIds.length
      ? supabase.from("profiles").select(PROFILE_COLS).in("user_id", memberIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("account_category", "umum")
      .eq("region_id", admin.regionId),
    supabase.rpc("get_member_emails"),
    supabase
      .from("action_participants")
      .select("user_id, community_actions!inner(pkk_unit_id)")
      .eq("community_actions.pkk_unit_id", admin.unitId),
  ]);
  if (memberProfiles.error) return fail("profil anggota", memberProfiles.error);
  if (residents.error) return fail("profil warga", residents.error);
  if (emails.error) console.error("[getManagedUsers] email:", emails.error.message); // tidak fatal
  if (actions.error) console.error("[getManagedUsers] aksi:", actions.error.message); // tidak fatal

  const emailById = new Map((emails.data ?? []).map((e) => [e.user_id, e.email]));
  const memberByUser = new Map(members.map((m) => [m.user_id, m]));
  const profileById = new Map(
    [...memberProfiles.data, ...residents.data].map((p) => [p.user_id, p])
  );

  const actionCount = new Map();
  for (const row of actions.data ?? []) {
    actionCount.set(row.user_id, (actionCount.get(row.user_id) ?? 0) + 1);
  }

  const toUser = (profile, type, joinedAt) => ({
    id: profile.user_id,
    name: profile.full_name,
    email: emailById.get(profile.user_id) ?? "",
    phone: profile.phone_number ?? "",
    type, // "pkk_chair" | "pkk_member" | "general"
    status: profile.account_status, // "active" | "suspended" | "pending"
    address: addressOf(profile, admin.areaLabel),
    joined: formatDate(joinedAt),
    suspendReason: profile.status_reason ?? "",
    actions: actions.error ? null : actionCount.get(profile.user_id) ?? 0,
  });

  const users = [];
  const registrations = [];

  for (const profile of profileById.values()) {
    const member = memberByUser.get(profile.user_id);

    if (member?.status === "verified") {
      users.push(toUser(profile, member.member_role === "leader" ? "pkk_chair" : "pkk_member", member.joined_at));
    } else if (member?.status === "pending" || profile.account_status === "pending") {
      const isPkk = member?.status === "pending";
      registrations.push({
        id: profile.user_id,
        name: profile.full_name,
        email: emailById.get(profile.user_id) ?? "",
        phone: profile.phone_number ?? "",
        type: isPkk ? "pkk" : "general",
        kelurahan: admin.areaLabel,
        kecamatan: admin.district,
        submittedAt: toMs(isPkk ? member.joined_at : profile.created_at),
      });
    } else {
      users.push(toUser(profile, "general", profile.created_at));
    }
  }

  users.sort((a, b) => a.name.localeCompare(b.name, "id"));
  return { users, registrations, error: null };
}