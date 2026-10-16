"use client";

import { createContext, useContext, type ReactNode } from "react";

const AuthContext = createContext(false);

export function AuthAvailability({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider value={enabled}>{children}</AuthContext.Provider>
  );
}

export function useAuthAvailable() {
  return useContext(AuthContext);
}
