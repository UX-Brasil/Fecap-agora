// Mock auth service. Uses SecureStore via storage util. Ready to swap for Supabase later.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { storage } from "@/src/utils/storage";
import { USERS } from "@/src/services/mock-data";
import { UserProfile } from "@/src/types";

const AUTH_KEY = "asa_current_user";

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (payload: { name: string; email: string; password: string; course: string }) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await storage.secureGet<string>(AUTH_KEY, "");
      if (stored) {
        try {
          const parsed = typeof stored === "string" && stored.startsWith("{") ? JSON.parse(stored) : null;
          if (parsed) setUser(parsed);
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (u: UserProfile | null) => {
    setUser(u);
    if (u) await storage.secureSet(AUTH_KEY, JSON.stringify(u));
    else await storage.secureRemove(AUTH_KEY);
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    // Any email works for demo — signs in as "Você" seed user.
    if (!email.includes("@")) return { ok: false, error: "E-mail inválido" };
    const me = { ...USERS[0], handle: `@${email.split("@")[0]}` };
    await persist(me);
    return { ok: true };
  }, [persist]);

  const signUp = useCallback(async ({ name, email, course }: { name: string; email: string; password: string; course: string }) => {
    if (!name || !email.includes("@")) return { ok: false, error: "Preencha nome e e-mail válidos" };
    const me: UserProfile = {
      ...USERS[0],
      name,
      handle: `@${email.split("@")[0]}`,
      course: course || USERS[0].course,
      xp: 100,
      level: 1,
      badges: [{ id: "b_welcome", label: "Bem-vindo", icon: "hand-right", earnedAt: new Date().toISOString() }],
    };
    await persist(me);
    return { ok: true };
  }, [persist]);

  const signOut = useCallback(async () => {
    await persist(null);
  }, [persist]);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    await persist(next);
  }, [user, persist]);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, signIn, signUp, signOut, updateProfile,
  }), [user, loading, signIn, signUp, signOut, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
