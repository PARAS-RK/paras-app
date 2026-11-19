import { requireAdmin, json } from "@/lib/api/guard";
import { getUserCounts } from "@/lib/users/queries";

export async function GET(request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;

  const counts = await getUserCounts(admin);
  if (counts.error) return json({ error: "Data gagal dimuat." }, 500);
  return json({ pkk: counts.pkk, citizens: counts.citizens });
}