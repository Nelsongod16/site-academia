"use client";

import Link from "next/link";
import { BarChart3, ChevronLeft, Dumbbell, LogOut, PlaySquare, UserCircle2, Users2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";

import { logoutFromFirebase } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const coreRoutes = new Set(["/feed", "/social", "/training", "/stats"]);
const items = [
  { href: "/feed", label: "Feed", icon: PlaySquare },
  { href: "/social", label: "Social", icon: Users2 },
  { href: "/training", label: "Treinos", icon: Dumbbell },
  { href: "/stats", label: "Desempenho", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: UserCircle2 },
];

export function DesktopSideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const signOut = useStore(useAppStore, (state) => state.signOut);
  const canGoBack = !coreRoutes.has(currentPath);

  async function handleSignOut() {
    await logoutFromFirebase();
    signOut();
    router.replace("/");
  }

  return (
    <aside className="group fixed inset-y-4 left-4 z-40 hidden lg:flex">
      <div className="glass-strong flex h-full w-[92px] flex-col overflow-hidden rounded-[28px] border border-white/8 px-4 py-5 transition-[width,transform] duration-300 ease-out group-hover:w-[268px]">
        <div className="flex min-h-14 items-center gap-3">
          <div className="overflow-hidden rounded-[18px] bg-white/6 p-1.5">
            {sessionUser?.avatarImage ? (
              <img src={sessionUser.avatarImage} alt={sessionUser.name ?? "Perfil"} className="size-11 rounded-[14px] object-cover" />
            ) : (
              <span className="inline-flex size-11 items-center justify-center rounded-[14px] bg-white/8 text-sm font-medium text-white">
                {sessionUser?.avatar ?? "PS"}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 opacity-0 transition duration-200 group-hover:opacity-100">
            <p className="truncate text-sm font-semibold text-white">{sessionUser?.name ?? "Perfil"}</p>
            <p className="truncate text-xs text-[var(--muted)]">{sessionUser?.username ?? ""}</p>
          </div>
        </div>

        {canGoBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 flex h-12 items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 text-left text-white transition hover:bg-white/[0.07]"
          >
            <span className="flex size-6 items-center justify-center">
              <ChevronLeft className="size-4" />
            </span>
            <span className="whitespace-nowrap text-sm opacity-0 transition duration-200 group-hover:opacity-100">Voltar</span>
          </button>
        ) : null}

        <nav className="mt-6 flex-1 space-y-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = currentPath === href || currentPath.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex h-13 items-center gap-3 rounded-[18px] px-3 transition",
                  active ? "bg-white text-black" : "text-[var(--muted)] hover:bg-white/[0.06] hover:text-white",
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center">
                  <Icon className="size-4" />
                </span>
                <span className="whitespace-nowrap text-sm font-medium opacity-0 transition duration-200 group-hover:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-4 flex h-13 items-center gap-3 rounded-[18px] px-3 text-[#ff9d9d] transition hover:bg-white/[0.06]"
        >
          <span className="flex size-6 shrink-0 items-center justify-center">
            <LogOut className="size-4" />
          </span>
          <span className="whitespace-nowrap text-sm font-medium opacity-0 transition duration-200 group-hover:opacity-100">
            Sair da conta
          </span>
        </button>
      </div>
    </aside>
  );
}
