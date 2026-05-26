"use client";

import { useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Input, MetricCard, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { formatDistance } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export function RunScreen() {
  const runs = useStore(useAppStore, (state) => state.runs);
  const addRun = useStore(useAppStore, (state) => state.addRun);
  const [km, setKm] = useState("5");
  const [meters, setMeters] = useState("0");
  const [time, setTime] = useState("32:00");

  const totalKm = useMemo(() => runs.reduce((sum, run) => sum + run.km + run.meters / 1000, 0), [runs]);

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="corrida" title="Registro simples" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Input value={km} onChange={(event) => setKm(event.target.value)} placeholder="KM" />
          <Input value={meters} onChange={(event) => setMeters(event.target.value)} placeholder="Metros" />
          <Input value={time} onChange={(event) => setTime(event.target.value)} placeholder="Tempo" />
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() =>
            addRun({
              km: Number(km) || 0,
              meters: Number(meters) || 0,
              time,
            })
          }
        >
          Salvar corrida
        </Button>
      </StrongSurface>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="total" value={formatDistance(totalKm)} hint="historico" />
        <MetricCard label="frequencia" value={`${runs.length}/mes`} hint="consistencia" />
        <MetricCard label="media" value={formatDistance(totalKm / Math.max(runs.length, 1))} hint="por corrida" />
      </div>

      <Surface className="rounded-[28px]">
        <SectionHeading eyebrow="historico" title="Ultimas corridas" />
        <div className="mt-4 space-y-3">
          {runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between rounded-[18px] border border-white/6 bg-white/4 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{formatDistance(run.km, run.meters)}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{new Date(run.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <p className="metric-number text-lg">{run.time}</p>
            </div>
          ))}
        </div>
      </Surface>
    </PageFrame>
  );
}
