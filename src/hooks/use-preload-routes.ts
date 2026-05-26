"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePreloadRoutes() {
  const router = useRouter();

  useEffect(() => {
    ["/dashboard", "/training", "/feed", "/exercises", "/stats"].forEach((route) => router.prefetch(route));
  }, [router]);
}
