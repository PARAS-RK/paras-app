import { CheckCircle2, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { areaLabel } from "@/lib/currentUser";

export const initialProfile = {
  name: "Ratna Sari",
  membershipStatus: "Ketua PKK Terverifikasi",
  address: `RT 06 / RW 04, ${areaLabel}, Kec. Kebayoran Baru, Jakarta Selatan`,
  joined: "5 Sep 2024",
  email: "ratna.s@gmail.com", 
  phone: "0815-4567-8901",
};

export const defaultProfilePhoto =
  "https://images.unsplash.com/photo-1681151730474-bd3ddbd3c9cf?auto=format&fit=crop&crop=face&w=240&h=240&q=80";

// Email sengaja tidak ada di sini: diubah lewat "Keamanan Akun" (dengan verifikasi)
export const profileFields = [
  { key: "name", label: "Nama Lengkap", icon: UserRound, type: "text" },
  { key: "membershipStatus", label: "Status Keanggotaan", icon: ShieldCheck, type: "text" },
  { key: "address", label: "Alamat", icon: MapPin, type: "text" },
  { key: "joined", label: "Bergabung Sejak", icon: CheckCircle2, type: "text" },
  { key: "phone", label: "Nomor HP", icon: Phone, type: "tel" },
];