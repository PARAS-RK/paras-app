import { CloudSun, HeartHandshake, Leaf, MessageCircle, ShieldCheck } from "lucide-react";

export const features = [
  {
      icon: CloudSun,
      title: "Info cuaca & bencana",
      description: "Pahami kondisi di sekitar Anda melalui informasi yang ringkas dan mudah ditindaklanjuti.",
  },
  {
      icon: MessageCircle,
      title: "Lapor dengan lebih mudah",
      description: "Ceritakan situasi melalui asisten percakapan dan pantau tindak lanjut laporan Anda.",
  },
  {
      icon: HeartHandshake,
      title: "Aksi komunitas",
      description: "Bergabung dalam aksi berbasis laporan warga yang telah dikurasi dan disetujui admin.",
  },
];

export const aboutBadges = [
  { icon: ShieldCheck, label: "Aman dan mudah", className: "bg-primary/10 text-primary" },
  { icon: HeartHandshake, label: "Berbasis komunitas", className: "bg-secondary/10 text-secondary" },
  { icon: Leaf, label: "Relevan secara lokal", className: "bg-accent/10 text-accent" },
];