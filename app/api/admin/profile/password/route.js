import { requireAdmin, json, fromAction, readJson } from "@/lib/api/guard";
import { changePassword } from "@/lib/profile/actions";
import { parsePasswordBody } from "@/lib/profile/validation";

export async function POST(request) {
  const { response } = await requireAdmin(request, { write: true, bucket: "password", limit: 5 });
  if (response) return response;

  const read = await readJson(request);
  if (read.response) return read.response;
  const parsed = parsePasswordBody(read.body);
  if (parsed.error) return json({ error: parsed.error }, 400);

  return fromAction(await changePassword(parsed.oldPassword, parsed.newPassword));
}