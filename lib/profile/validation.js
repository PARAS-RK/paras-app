import { isUuid } from "@/lib/users/validation";

export { isUuid };

const isText = (value) => typeof value === "string";
const isObject = (body) => body && typeof body === "object" && !Array.isArray(body);

export function parseProfileBody(body) {
  if (!isObject(body)) return { error: "Body harus berupa JSON." };
  const { name, phone, rt, rw } = body;
  if (!isText(name) || !name.trim() || name.trim().length > 100) {
    return { error: "name wajib diisi (maksimal 100 karakter)." };
  }
  for (const [key, value] of [["phone", phone], ["rt", rt], ["rw", rw]]) {
    if (value != null && !isText(value)) return { error: `${key} harus berupa teks.` };
    if (isText(value) && value.length > 20) return { error: `${key} terlalu panjang.` };
  }
  return { values: { name: name.trim(), phone: phone ?? "", rt: rt ?? "", rw: rw ?? "" } };
}

export function parseAvatarBody(body) {
  if (!isObject(body) || !isText(body.avatarUrl) || body.avatarUrl.length > 500) {
    return { error: "avatarUrl wajib berupa teks (maksimal 500 karakter)." };
  }
  return { avatarUrl: body.avatarUrl };
}

export function parsePasswordBody(body) {
  if (!isObject(body)) return { error: "Body harus berupa JSON." };
  const { oldPassword, newPassword } = body;
  if (!isText(oldPassword) || !isText(newPassword) || !oldPassword || !newPassword) {
    return { error: "oldPassword dan newPassword wajib diisi." };
  }
  if (oldPassword.length > 72 || newPassword.length > 72) return { error: "Kata sandi terlalu panjang." };
  return { oldPassword, newPassword };
}

export function parseEmailRequestBody(body) {
  if (!isObject(body)) return { error: "Body harus berupa JSON." };
  const { newEmail, password } = body;
  if (!isText(newEmail) || !isText(password) || !newEmail || !password) {
    return { error: "newEmail dan password wajib diisi." };
  }
  if (newEmail.length > 254 || password.length > 72) return { error: "Input terlalu panjang." };
  return { newEmail, password };
}

export function parseEmailVerifyBody(body) {
  if (!isObject(body)) return { error: "Body harus berupa JSON." };
  const { newEmail, codeNew, codeCurrent } = body;
  if (!isText(newEmail) || !isText(codeNew)) return { error: "newEmail dan codeNew wajib diisi." };
  if (codeCurrent != null && !isText(codeCurrent)) return { error: "codeCurrent harus berupa teks." };
  return { newEmail, codeNew, codeCurrent: codeCurrent ?? "" };
}

export function parseTransferBody(body) {
  if (!isObject(body)) return { error: "Body harus berupa JSON." };
  const { newLeaderId, password } = body;
  if (!isUuid(newLeaderId)) return { error: "newLeaderId bukan UUID yang valid." };
  if (!isText(password) || !password || password.length > 72) return { error: "password wajib diisi." };
  return { newLeaderId, password };
}