import "server-only";
import { createClient } from "@/lib/supabase/server";
import { maskPhone } from "./format";

/** Anggota PKK aktif di unit admin yang boleh menerima jabatan Ketua. Nomor HP sudah disamarkan. */
export async function getTransferCandidates(admin) {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("pkk_members")
    .select("user_id")
    .eq("pkk_unit_id", admin.unitId)
    .eq("member_role", "member")
    .eq("status", "verified");
  if (error) {
    console.error("[getTransferCandidates] pkk_members:", error.message);
    return [];
  }
  const ids = members.map((m) => m.user_id);
  if (!ids.length) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone_number")
    .in("user_id", ids)
    .eq("account_status", "active");
  if (profilesError) {
    console.error("[getTransferCandidates] profiles:", profilesError.message);
    return [];
  }

  return profiles
    .map((p) => ({ id: p.user_id, name: p.full_name, phone: maskPhone(p.phone_number) }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}