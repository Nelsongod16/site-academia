"use client";

import { useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Input, MetricCard, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { useAppStore } from "@/store/app-store";

export function SwimScreen() {
  const swims = useStore(useAppStore, (state) => state.swims);
  const addSwim = useStore(useAppStore, (state) => state.addSwim);
  const [distance, setDistance] = useState("1000");
  const [time, setTime] = useState("28:00");

  const totalDistance = useMemo(() => swims.reduce((sum, swim) => sum + swim.distance, 0), [swims]);

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="natacao" title="Salvar sessao" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Input value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="Distancia" />
          <Input value={time} onChange={(event) => setTime(event.target.value)} placeholder="Tempo" />
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() =>
            addSwim({
              distance: Number(distance) || 0,
              time,
            })
          }
        >
          Salvar natacao
        </Button>
      </StrongSurface>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="total" value={`${totalDistance} m`} hint="historico" />
        <MetricCard label="sessoes" value={`${swims.length}`} hint="registradas" />
        <MetricCard label="media" value={`${Math.round(totalDistance / Math.max(swims.length, 1))} m`} hint="por sessao" />
      </div>

      <Surface className="rounded-[28px]">
        <SectionHeading eyebrow="historico" title="Ultimos registros" />
        <div className="mt-4 space-y-3">
          {swims.map((swim) => (
            <div key={swim.id} className="flex items-center justify-between rounded-[18px] border border-white/6 bg-white/4 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{swim.distance} m</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{new Date(swim.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <p className="metric-number text-lg">{swim.time}</p>
            </div>
          ))}
        </div>
      </Surface>
    </PageFrame>
  );
}
