"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdmin } from "@/context/AdminContext";
import { setMyAvatar } from "@/lib/profile/actions";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function useAvatarUpload() {
  const { userId } = useAdmin();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = useCallback(
    async (file) => {
      setError("");
      if (!file) return;
      if (!TYPES.includes(file.type)) return setError("Format foto harus JPG, PNG, atau WebP.");
      if (file.size > MAX_BYTES) return setError("Ukuran foto maksimal 2 MB.");

      setUploading(true);
      try {
        const supabase = createClient();
        const path = `${userId}/avatar`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const result = await setMyAvatar(`${data.publicUrl}?v=${Date.now()}`);
        if (!result.ok) setError(result.error);
      } catch (e) {
        console.error("[useAvatarUpload]", e?.message);
        setError("Foto gagal diunggah. Coba lagi.");
      } finally {
        setUploading(false);
      }
    },
    [userId]
  );

  return { upload, uploading, error };
}