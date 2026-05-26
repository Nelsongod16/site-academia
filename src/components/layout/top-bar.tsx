"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { useStore } from "zustand";

import { StrongSurface } from "@/components/ui/kit";
import { useAppStore } from "@/store/app-store";

const routeMeta: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "visao geral", title: "Seu ciclo" },
  "/training": { eyebrow: "treino", title: "Semana e novos blocos" },
  "/exercises": { eyebrow: "biblioteca", title: "Exercicios e videos" },
  "/feed": { eyebrow: "social", title: "Feed real" },
  "/profile": { eyebrow: "perfil", title: "Resumo pessoal" },
  "/settings": { eyebrow: "ajustes", title: "Configuracoes" },
};

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const meta = routeMeta[pathname] ?? { eyebrow: "pulse studio", title: "Area logada" };
  const canGoBack = pathname !== "/dashboard";

  return (
    <StrongSurface className="sticky top-4 z-20 flex items-center justify-between gap-4 rounded-[28px] px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (canGoBack ? router.back() : router.push("/dashboard"))}
          className="flex size-11 items-center justify-center rounded-full bg-white text-black transition hover:brightness-95"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{meta.eyebrow}</p>
          <h1 className="mt-1 text-lg font-semibold tracking-[-0.04em]">{meta.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/training" className="hidden rounded-full bg-white/8 px-4 py-3 text-sm font-medium text-white md:inline-flex md:items-center md:gap-2">
          <Plus className="size-4" />
          Novo treino
        </Link>
        <Link href="/profile" className="rounded-full bg-white/8 px-3 py-2 text-sm font-medium">
          {sessionUser?.avatar ?? "PS"}
        </Link>
      </div>
    </StrongSurface>
  );
}
