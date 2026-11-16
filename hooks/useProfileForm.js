"use client";

import { useState, useTransition } from "react";
import { useAdmin } from "@/context/AdminContext";
import { updateProfile } from "@/lib/profile/actions";

export function useProfileForm() {
  const admin = useAdmin();

  const profile = {
    name: admin.name,
    phone: admin.phone ?? "",
    rt: admin.rt,
    rw: admin.rw,
    area: admin.areaFull,
    role: "Ketua PKK",
    joined: admin.joined,
  };

  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, startTransition] = useTransition();

  const startEdit = () => {
    setDraft(profile);
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setError("");
    setEditing(false);
  };

  const save = () => {
    setError("");
    startTransition(async () => {
      const result = await updateProfile(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  };

  return { profile, draft, setDraft, editing, saving, error, startEdit, cancelEdit, save };
}