"use client";

import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";

import { hasFirebaseConfig } from "@/lib/firebase/client";
import { saveSharedSnapshot, subscribeSharedSnapshot } from "@/lib/firebase/sync";
import { getSharedSnapshot, useAppStore } from "@/store/app-store";

export function useRealtimeSync() {
  const store = useAppStore;
  const sessionUser = useStore(store, (state) => state.sessionUser);
  const syncMode = useStore(store, (state) => state.syncMode);
  const setSyncMode = useStore(store, (state) => state.setSyncMode);
  const hydrateSharedSnapshot = useStore(store, (state) => state.hydrateSharedSnapshot);
  const snapshot = useStore(store, useMemo(() => (state) => getSharedSnapshot(state), []));
  const skipPublish = useRef(false);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      setSyncMode("local");
      return;
    }

    setSyncMode("firebase-ready");
  }, [setSyncMode]);

  useEffect(() => {
    if (!hasFirebaseConfig() || !sessionUser) {
      return;
    }

    const unsubscribe = subscribeSharedSnapshot((remote) => {
      if (!remote) {
        return;
      }

      skipPublish.current = true;
      hydrateSharedSnapshot(remote);
    });

    return unsubscribe;
  }, [hydrateSharedSnapshot, sessionUser]);

  useEffect(() => {
    if (!hasFirebaseConfig() || !sessionUser || syncMode === "local") {
      return;
    }

    if (skipPublish.current) {
      skipPublish.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void saveSharedSnapshot(snapshot);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [sessionUser, snapshot, syncMode]);
}
