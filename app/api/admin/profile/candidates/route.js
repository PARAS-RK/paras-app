import { requireAdmin, json } from "@/lib/api/guard";
import { getTransferCandidates } from "@/lib/profile/queries";

export async function GET(request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;

  const candidates = await getTransferCandidates(admin);
  return json({ count: candidates.length, data: candidates });
}