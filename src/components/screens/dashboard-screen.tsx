"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Clock3, MoveRight } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, MetricCard, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { currentStreak, monthlyRunDistance, monthlyWorkoutCount, totalMinutes, weeklyVolume } from "@/lib/stats";
import { formatDistance, formatDuration } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const moduleLabels: Record<string, string> = {
  today: "Hoje",
  volume: "Volume",
  activity: "Recentes",
  compare: "Semanas",
};

export function DashboardScreen() {
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const runs = useStore(useAppStore, (state) => state.runs);
  const feedPosts = useStore(useAppStore, (state) => state.feedPosts);
  const dashboardOrder = useStore(useAppStore, (state) => state.dashboardOrder);
  const setDashboardOrder = useStore(useAppStore, (state) => state.setDashboardOrder);
  const quickWorkoutId = useStore(useAppStore, (state) => state.quickWorkoutId);

  const weekly = useMemo(() => weeklyVolume(workouts), [workouts]);
  const streak = useMemo(() => currentStreak(workouts), [workouts]);
  const totalMonth = useMemo(() => monthlyWorkoutCount(workouts), [workouts]);
  const totalTrainingTime = useMemo(() => totalMinutes(workouts), [workouts]);
  const runMonth = useMemo(() => monthlyRunDistance(runs), [runs]);
  const nextWorkout = workouts.find((workout) => !workout.completed && workout.kind === "gym") ?? workouts[0];
  const quickWorkout = workouts.find((workout) => workout.id === quickWorkoutId) ?? nextWorkout;
  const recentFeed = [...feedPosts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 3);

  function moveModule(id: string, direction: -1 | 1) {
    const index = dashboardOrder.indexOf(id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= dashboardOrder.length) {
      return;
    }
    const next = [...dashboardOrder];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setDashboardOrder(next);
  }

  const modules = {
    today: (
      <StrongSurface key="today" className="rounded-[28px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">resumo do dia</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">{quickWorkout?.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {quickWorkout?.muscleGroups.join(" · ")} · {formatDuration(quickWorkout?.durationMinutes ?? 0)}
            </p>
          </div>
          <Link href="/training">
            <Button className="gap-2">
              abrir
              <MoveRight className="size-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <MetricCard label="streak" value={`${streak}x`} hint="dias ativos" />
          <MetricCard label="mes" value={`${totalMonth}`} hint="treinos" />
          <MetricCard label="corrida" value={formatDistance(runMonth)} hint="total mensal" />
        </div>
      </StrongSurface>
    ),
    volume: (
      <Surface key="volume" className="rounded-[28px]">
        <SectionHeading eyebrow="semanal" title="Volume e tempo" />
        <div className="mt-3 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekly}>
              <defs>
                <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#9cff79" stopOpacity={0.45} />
                  <stop offset="1" stopColor="#9cff79" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#91a0b8", fontSize: 11 }} />
              <Tooltip cursor={false} contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
              <Area type="monotone" dataKey="total" stroke="#9cff79" fill="url(#dashArea)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Tempo total salvo automaticamente. {formatDuration(totalTrainingTime)} acumulados.</p>
      </Surface>
    ),
    activity: (
      <Surface key="activity" className="rounded-[28px]">
        <SectionHeading eyebrow="atividade recente" title="Feed compacto" />
        <div className="mt-4 space-y-3">
          {recentFeed.map((post) => (
            <div key={post.id} className="flex items-center gap-3 rounded-[18px] border border-white/6 bg-white/3 p-3">
              <img src={post.image} alt={post.caption} className="h-16 w-16 rounded-[16px] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{post.caption}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{post.statsLabel} · streak {post.streakDays}</p>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    ),
    compare: (
      <Surface key="compare" className="rounded-[28px]">
        <SectionHeading eyebrow="comparativo" title="Ultimas semanas" />
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#91a0b8", fontSize: 11 }} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#0f1218", border: "1px solid rgba(255,255,255,0.08)" }} />
              <Bar dataKey="total" fill="#4fd1ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Surface>
    ),
  };

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.08em]">Evolucao limpa.</h2>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/4 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">proximo treino</p>
            <p className="mt-1 text-sm font-medium">{nextWorkout?.title}</p>
          </div>
        </div>
      </StrongSurface>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="ultimo treino" value={nextWorkout?.completed ? "feito" : "pendente"} hint={nextWorkout?.label} />
        <MetricCard label="tempo semanal" value={formatDuration(weekly.at(-1)?.total ?? 0)} hint="volume atual" />
        <MetricCard label="duracao media" value={formatDuration(Math.round(totalTrainingTime / Math.max(workouts.length, 1)))} hint="por sessao" />
        <MetricCard label="tempo total" value={formatDuration(totalTrainingTime)} hint="acumulado" />
      </div>

      <div className="grid gap-4">
        {dashboardOrder.map((id) => (
          <div key={id} className="space-y-2">
            <div className="flex justify-end gap-2">
              <button onClick={() => moveModule(id, -1)} className="rounded-full border border-white/8 bg-white/4 p-2 text-[var(--muted)]">
                <ArrowUp className="size-3.5" />
              </button>
              <button onClick={() => moveModule(id, 1)} className="rounded-full border border-white/8 bg-white/4 p-2 text-[var(--muted)]">
                <ArrowDown className="size-3.5" />
              </button>
              <div className="rounded-full border border-white/8 bg-white/4 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                {moduleLabels[id]}
              </div>
            </div>
            {modules[id as keyof typeof modules]}
          </div>
        ))}
      </div>

      <Link href="/training">
        <Surface className="flex items-center justify-between rounded-[24px]">
          <div>
            <p className="text-sm font-medium">Modo treino rapido</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Abrir ultimo treino, salvar e voltar.</p>
          </div>
          <Clock3 className="size-4 text-[var(--accent)]" />
        </Surface>
      </Link>
    </PageFrame>
  );
}
