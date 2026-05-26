"use client";

import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { exerciseUsage, monthlyRunDistance, muscleFrequency, trainingOverview, weeklyVolume } from "@/lib/stats";
import { formatDistance, formatDuration } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export function StatsScreen() {
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const runs = useStore(useAppStore, (state) => state.runs);
  const swims = useStore(useAppStore, (state) => state.swims);
  const exercises = useStore(useAppStore, (state) => state.exercises);

  const weekly = useMemo(() => weeklyVolume(workouts), [workouts]);
  const muscles = useMemo(() => muscleFrequency(workouts), [workouts]);
  const overview = useMemo(() => trainingOverview(workouts, runs, swims), [runs, swims, workouts]);
  const usage = useMemo(() => exerciseUsage(workouts, exercises), [exercises, workouts]);
  const runKm = useMemo(() => monthlyRunDistance(runs), [runs]);
  const totalSets = usage.reduce((sum, item) => sum + item.totalSets, 0);
  const currentWeek = weekly.at(-1)?.total ?? 0;

  return (
    <PageFrame className="gap-5">
      <StrongSurface className="rounded-[24px]">
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">performance</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.08em]">Desempenho com leitura mais limpa.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
              Menos painel administrativo e mais leitura objetiva do que esta ganhando volume, frequencia e consistencia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[16px] bg-white/4 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">corrida do mes</p>
              <p className="metric-number mt-2 text-2xl">{formatDistance(runKm)}</p>
            </div>
            <div className="rounded-[16px] bg-white/4 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">semana atual</p>
              <p className="metric-number mt-2 text-2xl">{formatDuration(currentWeek)}</p>
            </div>
            <div className="rounded-[16px] bg-white/4 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">musculos ativos</p>
              <p className="metric-number mt-2 text-2xl">{muscles.length}</p>
            </div>
            <div className="rounded-[16px] bg-white/4 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">sets totais</p>
              <p className="metric-number mt-2 text-2xl">{totalSets}</p>
            </div>
          </div>
        </div>
      </StrongSurface>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="weekly pulse" title="Frequencia semanal" />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="statsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#9cff79" stopOpacity={0.42} />
                    <stop offset="1" stopColor="#9cff79" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#91a0b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Area dataKey="total" stroke="#9cff79" strokeWidth={2} fill="url(#statsArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="focus split" title="Frequencia por musculo" />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={muscles}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#91a0b8", fontSize: 11 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Bar dataKey="value" fill="#4fd1ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="modality mix" title="Distribuicao do ciclo" />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={overview} dataKey="value" nameKey="label" innerRadius={58} outerRadius={84} fill="#c9a7ff" />
                <Tooltip contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="most used" title="Exercicios em destaque" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {usage.map((item) => (
              <div key={item.name} className="rounded-[16px] bg-white/4 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="metric-number text-sm">{item.totalSets} sets</p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.min(100, Math.max(16, (item.totalSets / Math.max(totalSets, 1)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </PageFrame>
  );
}
