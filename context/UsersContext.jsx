"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { manageUser } from "@/lib/users/actions";

const UsersDataContext = createContext(null);
const UserActionsContext = createContext(null);

export function UsersProvider({ users, registrations, loadError, children }) {
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const manage = useCallback((user, action, reason) => {
    setError("");
    setNotice("");
    setBusyId(user.id);
    startTransition(async () => {
      const result = await manageUser(user.id, action, reason);
      if (!result.ok) setError(result.error);
      else if (result.notice) setNotice(result.notice);
      setBusyId(null);
    });
  }, []);

  const approve = useCallback((user) => manage(user, "approve"), [manage]);
  const activate = useCallback((user) => manage(user, "activate"), [manage]);
  const clearMessages = useCallback(() => {
    setError("");
    setNotice("");
  }, []);

  const data = useMemo(() => ({ users, registrations, loadError }), [users, registrations, loadError]);
  const actions = useMemo(
    () => ({ approve, activate, manage, busyId, error, notice, clearMessages }),
    [approve, activate, manage, busyId, error, notice, clearMessages]
  );

  return (
    <UsersDataContext.Provider value={data}>
      <UserActionsContext.Provider value={actions}>{children}</UserActionsContext.Provider>
    </UsersDataContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersDataContext);
  if (!ctx) throw new Error("useUsers harus dipakai di dalam UsersProvider");
  return ctx;
}

export function useUserActions() {
  const ctx = useContext(UserActionsContext);
  if (!ctx) throw new Error("useUserActions harus dipakai di dalam UsersProvider");
  return ctx;
}