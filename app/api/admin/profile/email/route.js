import { requireAdmin, json, fromAction, readJson } from "@/lib/api/guard";
import { requestEmailChange } from "@/lib/profile/actions";
import { parseEmailRequestBody } from "@/lib/profile/validation";

export async function POST(request) {
  const { response } = await requireAdmin(request, { write: true, bucket: "email", limit: 5 });
  if (response) return response;

  const read = await readJson(request);
  if (read.response) return read.response;
  const parsed = parseEmailRequestBody(read.body);
  if (parsed.error) return json({ error: parsed.error }, 400);

  return fromAction(await requestEmailChange(parsed.newEmail, parsed.password));
}