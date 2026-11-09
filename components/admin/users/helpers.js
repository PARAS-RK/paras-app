export const typeConfig = {
    general: { label: "Warga Umum", pill: "bg-slate-100 text-slate-600" },
    pkk_member: { label: "Anggota PKK", pill: "bg-brand-light text-brand-dark" },
    pkk_chair: { label: "Anggota PKK", pill: "bg-brand-light text-brand-dark" },
  };
  
  export const statusConfig = {
    active: { label: "Aktif", pill: "bg-brand-light text-brand-dark" },
    suspended: { label: "Suspended", pill: "bg-red-100 text-red-700" },
  };
  
  export function initials(name) {
    return name
      .replace(/^(Ibu|Bapak)\s+/, "")
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  
  export const isPkk = (user) => user.type === "pkk_member" || user.type === "pkk_chair";