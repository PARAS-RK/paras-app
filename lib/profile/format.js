/** Disimpan sebagai +62..., ditampilkan sebagai 08... */
export function toE164(input) {
    const raw = String(input ?? "").replace(/[\s().-]/g, "");
    if (!raw) return "";
    if (raw.startsWith("+")) return raw;
    if (raw.startsWith("62")) return `+${raw}`;
    if (raw.startsWith("0")) return `+62${raw.slice(1)}`;
    return raw;
  }
  
  export function displayPhone(value) {
    const raw = String(value ?? "").replace(/[\s().-]/g, "");
    if (!raw) return "";
    if (raw.startsWith("+62")) return `0${raw.slice(3)}`;
    if (raw.startsWith("62")) return `0${raw.slice(2)}`;
    return raw;
  }
  
  export function maskPhone(value) {
    const shown = displayPhone(value);
    if (shown.length < 8) return shown;
    return `${shown.slice(0, 4)}****${shown.slice(-3)}`;
  }