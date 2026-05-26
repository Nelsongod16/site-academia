"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePreloadRoutes() {
  const router = useRouter();

  useEffect(() => {
    ["/feed", "/training", "/stats", "/profile"].forEach((route) => router.prefetch(route));
  }, [router]);
}
