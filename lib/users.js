import { areaLabel } from "@/lib/currentUser";

// DATA CONTOH untuk tampilan. Nanti diganti dari Supabase.
export const USERS = [
  { id: 1, name: "Ibu Sari Wulandari", email: "sari.w@gmail.com", phone: "0812-3456-7890", type: "pkk_member", status: "active", area: areaLabel, address: `RT 04 / RW 05, ${areaLabel}`, joined: "1 Sep 2024", reports: 3, actions: 2 },
  { id: 2, name: "Ibu Dewi Kartika", email: "dewi.k@gmail.com", phone: "0813-2345-6789", type: "pkk_chair", status: "active", area: areaLabel, address: `RT 02 / RW 03, ${areaLabel}`, joined: "15 Agu 2024", reports: 7, actions: 5 },
  { id: 3, name: "Bapak Ahmad Fauzi", email: "ahmad.f@gmail.com", phone: "0814-3456-7890", type: "general", status: "active", area: areaLabel, address: `RT 07 / RW 01, ${areaLabel}`, joined: "20 Agu 2024", reports: 1, actions: 0 },
  { id: 4, name: "Ibu Ratna Sari", email: "ratna.s@gmail.com", phone: "0815-4567-8901", type: "pkk_member", status: "active", area: areaLabel, address: `RT 06 / RW 04, ${areaLabel}`, joined: "5 Sep 2024", reports: 2, actions: 3 },
  { id: 5, name: "Ibu Sri Rahayu", email: "sri.r@gmail.com", phone: "0816-5678-9012", type: "general", status: "suspended", area: areaLabel, address: `RT 01 / RW 02, ${areaLabel}`, joined: "12 Jul 2024", reports: 0, actions: 0 },
  { id: 6, name: "Ibu Wulan Permatasari", email: "wulan.p@gmail.com", phone: "0817-6789-0123", type: "pkk_member", status: "active", area: areaLabel, address: `RT 09 / RW 05, ${areaLabel}`, joined: "18 Sep 2024", reports: 4, actions: 1 },
];