"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";

import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
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

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6">
        <TopBar />
        <main className="mt-4">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
