import { requireAdmin, json, fromAction, readJson } from "@/lib/api/guard";
import { updateMyProfile } from "@/lib/profile/actions";
import { displayPhone } from "@/lib/profile/format";
import { parseProfileBody } from "@/lib/profile/validation";

export async function GET(request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;

  return json({
    name: admin.name,
    email: admin.email,
    phone: displayPhone(admin.phone),
    rt: admin.rt,
    rw: admin.rw,
    area: admin.areaFull,
    unit: admin.unitName,
    role: "Ketua PKK",
    joined: admin.joined,
    memberCount: admin.memberCount,
    avatarUrl: admin.avatarUrl ?? null,
  });
}

export async function PATCH(request) {
  const { response } = await requireAdmin(request, { write: true, bucket: "profile" });
  if (response) return response;

  const read = await readJson(request);
  if (read.response) return read.response;
  const parsed = parseProfileBody(read.body);
  if (parsed.error) return json({ error: parsed.error }, 400);

  return fromAction(await updateMyProfile(parsed.values), { ok: true });
}