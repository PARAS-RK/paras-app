import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";

const hits = new Map(); // batas sederhana di memori (cukup untuk satu server, bukan produksi besar)
const LIMIT = 30;
const WINDOW_MS = 60_000;

export function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

function rateLimited(key) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

/** Pastikan permintaan berasal dari situs ini (Postman tanpa Origin tetap diizinkan). */
function originOk(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

/** Mengembalikan { admin } atau { response } yang langsung dikirim ke klien. */
export async function requireAdmin(request, { write = false } = {}) {
  if (write && !originOk(request)) return { response: json({ error: "Asal permintaan ditolak." }, 403) };

  const admin = await getAdminSession();
  if (!admin) return { response: json({ error: "Akses admin ditolak." }, 401) };

  if (write && rateLimited(admin.userId)) {
    return { response: json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, 429) };
  }
  return { admin };
}