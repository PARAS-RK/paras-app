"use client";

import { createContext, useContext, useMemo } from "react";

const ProfileContext = createContext(null);

export function ProfileProvider({ candidates, children }) {
  const value = useMemo(() => ({ candidates }), [candidates]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileData() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfileData harus dipakai di dalam ProfileProvider");
  return ctx;
}