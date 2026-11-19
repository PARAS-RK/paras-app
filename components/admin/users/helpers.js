export const typeConfig = {
  general: { label: "Warga Umum", pill: "bg-slate-100 text-slate-600" },
  pkk_member: { label: "Anggota PKK", pill: "bg-brand-light text-brand-dark" },
  pkk_chair: { label: "Anggota PKK", pill: "bg-brand-light text-brand-dark" },
};

export const statusConfig = {
  active: { label: "Aktif", pill: "bg-brand-light text-brand-dark" },
  suspended: { label: "Suspended", pill: "bg-red-100 text-red-700" },
  pending: { label: "Belum aktif", pill: "bg-amber-100 text-amber-800" },
  rejected: { label: "Ditolak", pill: "bg-rose-100 text-rose-700" },
};

export function initials(name) {
  return name
    .replace(/^(Ibu|Bapak|Mbak)\s+/, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const isPkk = (user) => user.type === "pkk_member" || user.type === "pkk_chair";

// Pilihan alasan (sama untuk anggota PKK dan warga umum)
export const REASONS = ["Penyalahgunaan akun", "Pelanggaran ketentuan", "Data tidak sesuai"];
export const REASON_OTHER = "Lainnya";
export const REASON_LEAVE = "Keluar dari PKK unit ini"; // khusus anggota PKK