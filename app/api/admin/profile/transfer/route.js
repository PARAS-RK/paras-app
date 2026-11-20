import { requireAdmin, json, readJson } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { parseTransferBody } from "@/lib/profile/validation";

export async function POST(request) {
  const { admin, response } = await requireAdmin(request, { write: true, bucket: "transfer", limit: 5 });
  if (response) return response;

  const read = await readJson(request);
  if (read.response) return read.response;
  const parsed = parseTransferBody(read.body);
  if (parsed.error) return json({ error: parsed.error }, 400);

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password: parsed.password,
  });
  if (authError) return json({ error: "Kata sandi salah." }, 403);

  const { error } = await supabase.rpc("change_leader", { p_new_leader: parsed.newLeaderId });
  if (error) {
    if (error.code === "42501") return json({ error: error.message }, 403);
    if (error.code === "P0001") return json({ error: error.message }, 422);
    console.error("[api/profile/transfer]", admin.userId, error.message);
    return json({ error: "Terjadi kesalahan sistem." }, 500);
  }

  return json({ ok: true, message: "Jabatan berhasil diserahkan. Anda kini anggota biasa." });
}

//tidak memakai transferLeadership karena fungsi itu redirect ke portal publik