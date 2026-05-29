"use client";

import { useEffect } from "react";
import { useStore } from "zustand";

import { LoginScreen } from "@/components/screens/login-screen";
import { useAppStore } from "@/store/app-store";

export function HomeScreen() {
  const hasHydrated = useStore(useAppStore, (state) => state.hasHydrated);
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);

  useEffect(() => {
    if (hasHydrated && sessionUser) {
      window.location.replace("/feed");
    }
  }, [hasHydrated, sessionUser]);

  if (!hasHydrated) {
    return null;
  }

  if (!sessionUser) {
    return <LoginScreen />;
  }

  return (
    <main
      className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(4,6,9,0.62) 0%, rgba(4,6,9,0.82) 48%, rgba(4,6,9,0.94) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=80')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[6px]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(156,255,121,0.12),transparent_26%),radial-gradient(circle_at_85%_8%,rgba(79,209,255,0.12),transparent_22%)]" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-[32px] p-6 text-center md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">abrindo app</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white md:text-4xl">Entrando no seu painel.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{sessionUser.email} ja foi autenticado. Redirecionando para o feed do app.</p>
        </div>
      </div>
    </main>
  );
}
