"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useAdmin } from "@/context/AdminContext";
import { updateMyProfile } from "@/lib/profile/actions";
import { displayPhone } from "@/lib/profile/format";

export function useProfileForm() {
  const admin = useAdmin();

  const profile = useMemo(
    () => ({
      name: admin.name,
      phone: displayPhone(admin.phone),
      rt: admin.rt,
      rw: admin.rw,
      area: admin.areaFull,
      role: "Ketua PKK",
      joined: admin.joined,
    }),
    [admin]
  );

  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, startTransition] = useTransition();

  const startEdit = useCallback(() => {
    setDraft(profile);
    setError("");
    setSaved(false);
    setEditing(true);
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setError("");
    setEditing(false);
  }, []);

  const save = useCallback(() => {
    setError("");
    startTransition(async () => {
      const result = await updateMyProfile(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setSaved(true);
    });
  }, [draft]);

  return { profile, draft, setDraft, editing, saving, error, saved, startEdit, cancelEdit, save };
}