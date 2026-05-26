"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";

import { BottomNav } from "@/components/layout/bottom-nav";
import { FabSheet } from "@/components/layout/fab-sheet";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { TopBar } from "@/components/layout/top-bar";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { usePreloadRoutes } from "@/hooks/use-preload-routes";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useScrollMemory } from "@/hooks/use-scroll-memory";
import { useAppStore } from "@/store/app-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const online = useOnlineStatus();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const setConnectionHint = useStore(useAppStore, (state) => state.setConnectionHint);

  usePreloadRoutes();
  useRealtimeSync();
  useScrollMemory();

  useEffect(() => {
    if (!sessionUser) {
      router.replace("/");
    }
  }, [router, sessionUser]);

  useEffect(() => {
    setConnectionHint(online ? "saved" : "offline");
  }, [online, setConnectionHint]);

  if (!sessionUser && pathname !== "/" && pathname !== "/register") {
    return null;
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-4 md:pl-28">
        <BottomNav />
        <main className="safe-bottom w-full px-4 pb-10 pt-4 md:px-6">
          <TopBar />
          <div className="mt-4">
            <InstallPrompt />
          </div>
          {children}
        </main>
      </div>
      <FabSheet />
    </div>
  );
}
