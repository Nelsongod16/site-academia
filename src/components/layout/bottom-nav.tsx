"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Camera, Dumbbell, Home, PlaySquare, Settings, User2 } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: PlaySquare },
  { href: "/training", label: "Treino", icon: Dumbbell },
  { href: "/photos", label: "Fotos", icon: Camera },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: User2 },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 rounded-[24px] border px-2 py-2 md:left-6 md:top-6 md:bottom-6 md:w-[88px] md:px-2 md:py-4">
      <div className="grid grid-cols-7 gap-1 md:flex md:h-full md:flex-col md:justify-between">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-[18px] px-2 text-[10px] uppercase tracking-[0.18em] transition md:gap-2 md:text-[11px]",
                active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-white/5",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden md:block">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
