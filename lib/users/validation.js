const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ACTIONS = ["approve", "reject", "suspend", "activate", "leave"];
export const NEEDS_REASON = ["reject", "suspend"];
export const isUuid = (value) => typeof value === "string" && UUID.test(value);

/** Mengembalikan { error } atau { action, reason }. */
export function parseActionBody(body) {
  if (!body || typeof body !== "object") return { error: "Body harus berupa JSON." };
  const { action, reason } = body;
  if (!ACTIONS.includes(action)) return { error: `action harus salah satu dari: ${ACTIONS.join(", ")}.` };
  if (reason != null && typeof reason !== "string") return { error: "reason harus berupa teks." };

  const cleaned = typeof reason === "string" ? reason.trim() : "";
  if (cleaned.length > 200) return { error: "reason maksimal 200 karakter." };
  if (NEEDS_REASON.includes(action) && !cleaned) return { error: "reason wajib diisi untuk aksi ini." };
  return { action, reason: cleaned || null };
}