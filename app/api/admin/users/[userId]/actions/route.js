import { requireAdmin, json } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseActionBody } from "@/lib/users/validation";

export async function POST(request, { params }) {
  const { admin, response } = await requireAdmin(request, { write: true });
  if (response) return response;

  const { userId } = await params;
  if (!isUuid(userId)) return json({ error: "userId bukan UUID yang valid." }, 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body harus berupa JSON yang valid." }, 400);
  }
  const parsed = parseActionBody(body);
  if (parsed.error) return json({ error: parsed.error }, 400);

  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_user", {
    p_user_id: userId,
    p_action: parsed.action,
    p_reason: parsed.reason,
  });

  if (error) {
    // Pesan raise exception dari fungsi database aman ditampilkan; selain itu disamarkan
    if (error.code === "42501") return json({ error: error.message }, 403);
    if (error.code === "P0001") return json({ error: error.message }, 422);
    console.error("[api/users/actions]", admin.userId, error.message);
    return json({ error: "Terjadi kesalahan sistem." }, 500);
  }

  return json({ ok: true, userId, action: parsed.action });
}