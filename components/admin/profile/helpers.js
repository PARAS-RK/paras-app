export function initials(name) {
  return name
    .replace(/^(Ibu|Bapak|Mbak)\s+/, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function passwordStrength(password) {
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { label: "Lemah", width: "33%", tone: "bg-red-500", text: "text-red-600" };
  }
  if (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  ) {
    return { label: "Kuat", width: "100%", tone: "bg-brand", text: "text-brand" };
  }
  return { label: "Sedang", width: "66%", tone: "bg-amber-500", text: "text-amber-700" };
}