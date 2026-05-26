"use client";

import Link from "next/link";
import { BarChart3, Dumbbell, PlaySquare, User2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/feed", label: "Feed", icon: PlaySquare },
  { href: "/training", label: "Treinos", icon: Dumbbell },
  { href: "/stats", label: "Desempenho", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: User2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 rounded-[20px] px-2 py-2 md:left-1/2 md:w-[720px] md:-translate-x-1/2 md:inset-x-auto">
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-[16px] px-2 text-[10px] uppercase tracking-[0.16em] transition md:min-h-15 md:flex-row md:gap-3 md:text-[11px]",
                active ? "bg-white text-black" : "text-[var(--muted)] hover:bg-white/6",
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
