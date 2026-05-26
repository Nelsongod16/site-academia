"use client";

import { useMemo } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { MetricCard, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { currentStreak, monthlyRunDistance, totalMinutes } from "@/lib/stats";
import { formatDuration } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export function ProfileScreen() {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const runs = useStore(useAppStore, (state) => state.runs);
  const favoriteExerciseIds = useStore(useAppStore, (state) => state.favoriteExerciseIds);
  const exercises = useStore(useAppStore, (state) => state.exercises);

  const streak = useMemo(() => currentStreak(workouts), [workouts]);
  const minutes = useMemo(() => totalMinutes(workouts), [workouts]);
  const runKm = useMemo(() => monthlyRunDistance(runs), [runs]);

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="perfil" title={sessionUser?.name ?? "Atleta"} />
        <p className="mt-2 text-sm text-[var(--muted)]">{sessionUser?.email}</p>
      </StrongSurface>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="treinos" value={`${workouts.filter((workout) => workout.completed).length}`} />
        <MetricCard label="corridas" value={`${runs.length}`} />
        <MetricCard label="tempo total" value={formatDuration(minutes)} />
        <MetricCard label="streak" value={`${streak}x`} />
      </div>

      <Surface className="rounded-[28px]">
        <SectionHeading eyebrow="favoritos" title="Biblioteca pessoal" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {favoriteExerciseIds.map((id) => {
            const exercise = exercises.find((item) => item.id === id);
            if (!exercise) {
              return null;
            }

            return (
              <div key={id} className="rounded-[18px] border border-white/6 bg-white/4 px-4 py-3">
                <p className="text-sm font-medium">{exercise.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {exercise.muscle} · {exercise.equipment}
                </p>
              </div>
            );
          })}
        </div>
      </Surface>

      <Surface className="rounded-[28px]">
        <SectionHeading eyebrow="resumo" title="Atividade recente" />
        <div className="mt-4 flex items-center justify-between rounded-[18px] border border-white/6 bg-white/4 px-4 py-3">
          <p className="text-sm">KM corridos no mes</p>
          <p className="metric-number text-lg">{runKm.toFixed(1)}</p>
        </div>
      </Surface>
    </PageFrame>
  );
}
