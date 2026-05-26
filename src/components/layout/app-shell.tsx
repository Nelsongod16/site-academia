"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";

import { useAppStore } from "@/store/app-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useStore(useAppStore, (state) => state.hasHydrated);
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);

  useEffect(() => {
    if (hasHydrated && !sessionUser) {
      router.replace("/");
    }
  }, [hasHydrated, router, sessionUser]);

  if (!hasHydrated) {
    return null;
  }

  if (!sessionUser && pathname !== "/" && pathname !== "/register") {
    return null;
  }

  return <main className="app-shell min-h-screen">{children}</main>;
}
