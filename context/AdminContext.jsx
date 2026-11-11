"use client";

import { createContext, useContext } from "react";

const AdminContext = createContext(null);

/** Menyediakan data admin yang sedang login (hasil getAdminSession di server). */
export function AdminProvider({ admin, children }) {
  return <AdminContext.Provider value={admin}>{children}</AdminContext.Provider>;
}

/** Hook untuk membaca data admin. Hanya untuk client component. */
export function useAdmin() {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error("useAdmin harus dipakai di dalam AdminProvider");
  return admin;
}