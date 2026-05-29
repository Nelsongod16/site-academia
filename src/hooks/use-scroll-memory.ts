"use client";

import { useEffect, useEffectEvent } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "zustand";

import { useAppStore } from "@/store/app-store";

export function useScrollMemory() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const rememberScroll = useStore(useAppStore, (state) => state.rememberScroll);
  const scrollMemory = useStore(useAppStore, (state) => state.scrollMemory);

  const saveScroll = useEffectEvent(() => {
    rememberScroll(currentPath, window.scrollY);
  });

  useEffect(() => {
    const saved = scrollMemory[currentPath];
    if (typeof saved === "number") {
      window.requestAnimationFrame(() => window.scrollTo({ top: saved }));
    }
  }, [currentPath, scrollMemory]);

  useEffect(() => {
    const handleScroll = () => saveScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}
