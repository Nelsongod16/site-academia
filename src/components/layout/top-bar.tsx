"use client";

import Link from "next/link";
import { WifiOff, Zap } from "lucide-react";
import { useStore } from "zustand";

import { StrongSurface } from "@/components/ui/kit";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAppStore } from "@/store/app-store";

export function TopBar() {
  const online = useOnlineStatus();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const connectionHint = useStore(useAppStore, (state) => state.connectionHint);

  return (
    <StrongSurface className="sticky top-4 z-20 flex flex-row items-center justify-between gap-3 p-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">pulse studio</p>
        <h1 className="mt-1 text-lg font-semibold tracking-[-0.04em]">Treino sem ruído.</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-full border border-white/8 bg-white/4 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          {online ? connectionHint : "offline"}
        </div>
        <div className="rounded-full border border-white/8 bg-white/4 px-3 py-2 text-sm">
          {online ? <Zap className="size-4 text-[var(--accent)]" /> : <WifiOff className="size-4 text-[var(--warn)]" />}
        </div>
        <Link href="/profile" className="rounded-full border border-white/8 bg-white/4 px-3 py-2 text-sm font-medium">
          {sessionUser?.avatar ?? "PS"}
        </Link>
      </div>
    </StrongSurface>
  );
}
