"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";

import { StrongSurface } from "@/components/ui/kit";
import { useAppStore } from "@/store/app-store";

const routeMeta: Record<string, { eyebrow: string; title: string }> = {
  "/feed": { eyebrow: "community", title: "Feed" },
  "/training": { eyebrow: "builder", title: "Treinos" },
  "/stats": { eyebrow: "performance", title: "Desempenho" },
  "/profile": { eyebrow: "public profile", title: "Perfil" },
  "/settings": { eyebrow: "preferences", title: "Ajustes" },
};

const coreRoutes = new Set(["/feed", "/training", "/stats", "/profile"]);

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const meta = routeMeta[pathname] ?? { eyebrow: "pulse studio", title: "Area logada" };
  const canGoBack = !coreRoutes.has(pathname);

  return (
    <StrongSurface className="sticky top-4 z-20 flex items-center justify-between gap-4 rounded-[18px] px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (canGoBack ? router.back() : router.push("/feed"))}
          className={`flex size-11 items-center justify-center rounded-[14px] transition ${
            canGoBack ? "bg-white text-black hover:brightness-95" : "bg-[var(--accent-soft)] text-[var(--accent)]"
          }`}
        >
          {canGoBack ? <ArrowLeft className="size-4" /> : <Sparkles className="size-4" />}
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{meta.eyebrow}</p>
          <h1 className="mt-1 text-lg font-semibold tracking-[-0.04em]">{meta.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/training" className="hidden rounded-[14px] bg-white/6 px-4 py-3 text-sm font-medium text-white md:inline-flex md:items-center md:gap-2">
          <Plus className="size-4" />
          Novo treino
        </Link>
        <Link href="/profile" className="overflow-hidden rounded-[14px] bg-white/6 p-1.5">
          {sessionUser?.avatarImage ? (
            <img src={sessionUser.avatarImage} alt={sessionUser.name ?? "Perfil"} className="size-8 rounded-[10px] object-cover" />
          ) : (
            <span className="inline-flex size-8 items-center justify-center rounded-[10px] bg-white/8 text-sm font-medium">
              {sessionUser?.avatar ?? "PS"}
            </span>
          )}
        </Link>
      </div>
    </StrongSurface>
  );
}
