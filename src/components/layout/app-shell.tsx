"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";

import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSideNav } from "@/components/layout/desktop-side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/store/app-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  if (!sessionUser) {
    return null;
  }

  return (
    <div className="app-shell min-h-screen">
      <DesktopSideNav />
      <div className="mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-5 lg:ml-[120px] lg:max-w-none lg:px-8 lg:pb-8 lg:pt-5">
        <div className="lg:hidden">
          <TopBar />
        </div>
        <main className="mt-3 lg:mt-0">{children}</main>
      </div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
