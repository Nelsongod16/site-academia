"use client";

import { Download } from "lucide-react";

import { Button, Surface } from "@/components/ui/kit";
import { usePwa } from "@/hooks/use-pwa";

export function InstallPrompt() {
  const { canInstall, install } = usePwa();

  if (!canInstall) {
    return null;
  }

  return (
    <Surface className="flex items-center justify-between gap-3 rounded-[20px] px-4 py-3">
      <div>
        <p className="text-sm font-medium">Instalar app</p>
        <p className="text-xs text-[var(--muted)]">Abrir no celular com cara de app nativo.</p>
      </div>
      <Button onClick={() => void install()} className="gap-2">
        <Download className="size-4" />
        Instalar
      </Button>
    </Surface>
  );
}
