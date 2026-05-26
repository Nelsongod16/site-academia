"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "zustand";

import { useAppStore } from "@/store/app-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);

  useEffect(() => {
    if (!sessionUser) {
      window.location.replace("/");
    }
  }, [sessionUser]);

  if (!sessionUser && pathname !== "/" && pathname !== "/register") {
    return null;
  }

  return <main className="app-shell min-h-screen">{children}</main>;
}
