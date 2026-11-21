import { requireAdmin, json } from "@/lib/api/guard";
import { getManagedUsers } from "@/lib/users/queries";

const CATEGORIES = ["pkk", "general", "pending"];

export async function GET(request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  if (category && !CATEGORIES.includes(category)) {
    return json({ error: `category harus salah satu dari: ${CATEGORIES.join(", ")}.` }, 400);
  }

  const { users, registrations, error } = await getManagedUsers(admin);
  if (error) return json({ error }, 500);

  const isPkk = (u) => u.type === "pkk_member" || u.type === "pkk_chair";
  let list = category === "pending" ? registrations : users;
  if (category === "pkk") list = list.filter(isPkk);
  if (category === "general") list = list.filter((u) => !isPkk(u));
  if (q) list = list.filter((u) => u.name.toLowerCase().includes(q));

  return json({ count: list.length, data: list });
}