import { requireAdmin, json, fromAction, readJson } from "@/lib/api/guard";
import { verifyEmailChange } from "@/lib/profile/actions";
import { parseEmailVerifyBody } from "@/lib/profile/validation";

export async function POST(request) {
  const { response } = await requireAdmin(request, { write: true, bucket: "email-verify", limit: 5 });
  if (response) return response;

  const read = await readJson(request);
  if (read.response) return read.response;
  const parsed = parseEmailVerifyBody(read.body);
  if (parsed.error) return json({ error: parsed.error }, 400);

  return fromAction(await verifyEmailChange(parsed.newEmail, parsed.codeNew, parsed.codeCurrent));
}