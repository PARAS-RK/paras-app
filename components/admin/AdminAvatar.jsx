"use client";

import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";

export default function AdminAvatar({ className }) {
  const { avatarUrl, initials, name } = useAdmin();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`Foto profil ${name}`}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-brand font-black text-white", className)}>
      {initials}
    </span>
  );
}