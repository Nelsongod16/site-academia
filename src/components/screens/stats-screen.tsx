"use client";

import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { MetricCard, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { exerciseUsage, monthlyRunDistance, muscleFrequency, trainingOverview, weeklyVolume } from "@/lib/stats";
import { formatDistance } from "@/lib/utils";
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

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="estatisticas" title="Evolucao objetiva" />
      </StrongSurface>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="corrida mes" value={formatDistance(runKm)} />
        <MetricCard label="musculos" value={`${muscles.length}`} hint="com frequencia" />
        <MetricCard label="series totais" value={`${usage.reduce((sum, item) => sum + item.totalSets, 0)}`} />
        <MetricCard label="exercicios" value={`${usage.length}`} hint="ativos" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="volume" title="Frequencia semanal" />
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="statsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#4fd1ff" stopOpacity={0.45} />
                    <stop offset="1" stopColor="#4fd1ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#91a0b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Area dataKey="total" stroke="#4fd1ff" strokeWidth={2} fill="url(#statsArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>
        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="musc." title="Frequencia por musculo" />
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={muscles}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#91a0b8", fontSize: 11 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Bar dataKey="value" fill="#9cff79" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="modalidades" title="Distribuicao" />
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={overview} dataKey="value" nameKey="label" innerRadius={60} outerRadius={84} fill="#c9a7ff" />
                <Tooltip contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Surface>
        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="exercicios" title="Mais usados" />
          <div className="mt-4 space-y-3">
            {usage.map((item) => (
              <div key={item.name} className="rounded-[18px] border border-white/6 bg-white/4 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="metric-number text-sm">{item.totalSets} sets</p>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </PageFrame>
  );
}
