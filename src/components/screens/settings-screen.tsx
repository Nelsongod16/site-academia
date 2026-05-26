"use client";

import { ShieldCheck, Smartphone, Wifi, Workflow } from "lucide-react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { logoutFromFirebase } from "@/lib/firebase/auth";
import { useAppStore } from "@/store/app-store";

export function SettingsScreen() {
  const signOut = useStore(useAppStore, (state) => state.signOut);
  const syncMode = useStore(useAppStore, (state) => state.syncMode);

  async function handleSignOut() {
    await logoutFromFirebase();
    signOut();
  }

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="configuracoes" title="Ajustes e estrutura" />
      </StrongSurface>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="rounded-[28px]">
          <div className="flex items-center gap-3">
            <Wifi className="size-4 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-medium">Sincronizacao</p>
              <p className="text-xs text-[var(--muted)]">{hasFirebaseConfig() ? `Modo ${syncMode}` : "Local pronto para Firebase"}</p>
            </div>
          </div>
        </Surface>
        <Surface className="rounded-[28px]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4 text-[var(--sky)]" />
            <div>
              <p className="text-sm font-medium">Backup automatico</p>
              <p className="text-xs text-[var(--muted)]">Autosave local e camada pronta para nuvem.</p>
            </div>
          </div>
        </Surface>
        <Surface className="rounded-[28px]">
          <div className="flex items-center gap-3">
            <Smartphone className="size-4 text-[var(--warn)]" />
            <div>
              <p className="text-sm font-medium">PWA e offline</p>
              <p className="text-xs text-[var(--muted)]">Instalacao, splash, cache e uso parcial offline.</p>
            </div>
          </div>
        </Surface>
        <Surface className="rounded-[28px]">
          <div className="flex items-center gap-3">
            <Workflow className="size-4 text-[var(--violet)]" />
            <div>
              <p className="text-sm font-medium">Pronto para crescer</p>
              <p className="text-xs text-[var(--muted)]">IA, smartwatch, amigos, push e API externa preparados.</p>
            </div>
          </div>
        </Surface>
      </div>

      <Button variant="secondary" onClick={() => void handleSignOut()} className="w-full">
        Sair
      </Button>
    </PageFrame>
  );
}
