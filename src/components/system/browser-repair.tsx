"use client";

import { useEffect } from "react";

const CACHE_PREFIXES = ["pulse-studio-", "site-academia-", "workbox-"];
const RELOAD_FLAG = "pulse-browser-repair-reloaded";

function matchesRepairCache(key: string) {
  return CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function BrowserRepair() {
  useEffect(() => {
    let cancelled = false;

    async function repairBrowserState() {
      const hadController = typeof navigator !== "undefined" && Boolean(navigator.serviceWorker?.controller);
      let removedRegistration = false;

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map(async (registration) => {
            const removed = await registration.unregister();
            removedRegistration = removedRegistration || removed;
          }),
        );
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(matchesRepairCache).map((key) => caches.delete(key)));
      }

      if (cancelled || !hadController || !removedRegistration) {
        return;
      }

      if (window.sessionStorage.getItem(RELOAD_FLAG) === "1") {
        window.sessionStorage.removeItem(RELOAD_FLAG);
        return;
      }

      window.sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }

    void repairBrowserState();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
