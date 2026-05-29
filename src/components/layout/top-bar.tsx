"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";

import { StrongSurface } from "@/components/ui/kit";
import { logoutFromFirebase } from "@/lib/firebase/auth";
import { useAppStore } from "@/store/app-store";

const coreRoutes = new Set(["/feed", "/social", "/training", "/stats"]);
const routeLabels: Record<string, string> = {
  "/feed": "feed",
  "/social": "social",
  "/training": "treinos",
  "/stats": "desempenho",
  "/profile": "perfil",
  "/settings": "perfil",
};

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const signOut = useStore(useAppStore, (state) => state.signOut);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canGoBack = !coreRoutes.has(currentPath);
  const routeLabel =
    Object.entries(routeLabels).find(([route]) => currentPath === route || currentPath.startsWith(`${route}/`))?.[1] ?? "pulse";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await logoutFromFirebase();
    signOut();
    setMenuOpen(false);
    router.replace("/");
  }

  return (
    <StrongSurface className="sticky top-4 z-20 flex items-center justify-between gap-4 rounded-[18px] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {canGoBack ? (
          <button
            onClick={() => router.back()}
            className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-black transition hover:brightness-95"
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : null}

        <div ref={menuRef} className="relative flex min-w-0 items-center gap-3">
          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="overflow-hidden rounded-[14px] bg-white/6 p-1.5 transition hover:bg-white/10"
          >
            {sessionUser?.avatarImage ? (
              <img src={sessionUser.avatarImage} alt={sessionUser.name ?? "Perfil"} className="size-10 rounded-[10px] object-cover" />
            ) : (
              <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-white/8 text-sm font-medium">
                {sessionUser?.avatar ?? "PS"}
              </span>
            )}
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{sessionUser?.name ?? "Perfil"}</p>
            <p className="truncate text-xs text-[var(--muted)]">{sessionUser?.username ?? ""}</p>
          </div>

          <button onClick={() => setMenuOpen((current) => !current)} className="flex size-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-white/6 hover:text-white">
            <ChevronDown className="size-4" />
          </button>

          {menuOpen ? (
            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-30 min-w-44 rounded-[16px] border border-white/8 bg-[#0b1017] p-2 shadow-[0_18px_48px_rgba(0,0,0,0.32)]">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-sm text-white transition hover:bg-white/6"
              >
                <UserCircle2 className="size-4 text-[var(--accent)]" />
                Perfil
              </Link>
              <button
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-sm text-white transition hover:bg-white/6"
              >
                <LogOut className="size-4 text-[var(--warn)]" />
                Sair da conta
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="text-right">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">{routeLabel}</p>
      </div>
    </StrongSurface>
  );
}
