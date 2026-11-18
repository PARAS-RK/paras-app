import { CheckCircle2, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";

// Email diubah lewat "Keamanan Akun". Wilayah, jabatan, dan tanggal bergabung hanya baca.
export const profileFields = [
  { key: "name", label: "Nama Lengkap", icon: UserRound, type: "text", editable: true },
  { key: "phone", label: "Nomor HP", icon: Phone, type: "tel", editable: true },
  { key: "rt", label: "RT", icon: MapPin, type: "text", editable: true },
  { key: "rw", label: "RW", icon: MapPin, type: "text", editable: true },
  { key: "area", label: "Wilayah", icon: MapPin, type: "text" },
  { key: "role", label: "Status Keanggotaan", icon: ShieldCheck, type: "text" },
  { key: "joined", label: "Bergabung Sejak", icon: CheckCircle2, type: "text" },
];