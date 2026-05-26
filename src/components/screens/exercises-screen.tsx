"use client";

import { Heart, Search, Sparkles } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Chip, Input, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { useAppStore } from "@/store/app-store";

const bodyFilters = ["peito", "costas", "quadriceps", "ombro", "biceps", "cardio"];

export function ExercisesScreen() {
  const exercises = useStore(useAppStore, (state) => state.exercises);
  const quickWorkoutId = useStore(useAppStore, (state) => state.quickWorkoutId);
  const favoriteExerciseIds = useStore(useAppStore, (state) => state.favoriteExerciseIds);
  const favoriteExercise = useStore(useAppStore, (state) => state.favoriteExercise);
  const addExercisesToWorkout = useStore(useAppStore, (state) => state.addExercisesToWorkout);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string>("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch =
        !deferredSearch ||
        `${exercise.name} ${exercise.description} ${exercise.execution} ${exercise.muscle}`.toLowerCase().includes(deferredSearch.toLowerCase());
      const matchesMuscle = !muscleFilter || exercise.muscle === muscleFilter;
      const matchesEquipment = !equipmentFilter || exercise.equipment === equipmentFilter;
      const matchesDifficulty = !difficultyFilter || exercise.difficulty === difficultyFilter;

      return matchesSearch && matchesMuscle && matchesEquipment && matchesDifficulty;
    });
  }, [deferredSearch, difficultyFilter, equipmentFilter, exercises, muscleFilter]);

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="biblioteca" title="Exercicios" />
        <div className="mt-4 flex items-center gap-2 rounded-[20px] border border-white/8 bg-white/4 px-4 py-3">
          <Search className="size-4 text-[var(--muted)]" />
          <input
            value={search}
            onChange={(event) => startTransition(() => setSearch(event.target.value))}
            placeholder="Busca instantanea"
            className="w-full bg-transparent text-sm placeholder:text-[var(--muted)]"
          />
        </div>
      </StrongSurface>

      <Surface className="rounded-[28px]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {bodyFilters.map((muscle) => (
              <Chip key={muscle} active={muscleFilter === muscle} onClick={() => setMuscleFilter((value) => (value === muscle ? "" : muscle))}>
                {muscle}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["maquina", "halter", "barra", "peso corporal", "cabo"].map((item) => (
              <Chip key={item} active={equipmentFilter === item} onClick={() => setEquipmentFilter((value) => (value === item ? "" : item))}>
                {item}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["iniciante", "intermediario", "avancado"].map((item) => (
              <Chip key={item} active={difficultyFilter === item} onClick={() => setDifficultyFilter((value) => (value === item ? "" : item))}>
                {item}
              </Chip>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((exercise) => {
          const favorite = favoriteExerciseIds.includes(exercise.id);
          return (
            <Surface key={exercise.id} className="overflow-hidden rounded-[28px] p-0">
              <img src={exercise.mediaUrl} alt={exercise.name} className="h-48 w-full object-cover" loading="lazy" />
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.04em]">{exercise.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {exercise.muscle} · {exercise.equipment} · {exercise.difficulty}
                    </p>
                  </div>
                  <button
                    onClick={() => favoriteExercise(exercise.id)}
                    className={`rounded-full border p-2 ${favorite ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-white/8 bg-white/4 text-[var(--muted)]"}`}
                  >
                    <Heart className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-[var(--muted)]">{exercise.description}</p>
                <p className="text-sm">{exercise.execution}</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondaryMuscles.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => quickWorkoutId && addExercisesToWorkout(quickWorkoutId, [exercise.id])}
                    className="flex-1"
                    variant={quickWorkoutId ? "primary" : "secondary"}
                  >
                    {quickWorkoutId ? "Adicionar ao treino" : "Abra um treino primeiro"}
                  </Button>
                  <div className="rounded-[16px] border border-white/8 bg-white/4 px-3 py-3 text-xs text-[var(--muted)]">
                    {exercise.category}
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/6 bg-white/3 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">relacionados</p>
                  <p className="mt-2 text-sm">
                    {exercise.relatedIds
                      .map((id) => exercises.find((item) => item.id === id)?.name)
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            </Surface>
          );
        })}
      </div>

      <Surface className="flex items-center gap-3 rounded-[22px]">
        <Sparkles className="size-4 text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">Busca sem reload, filtros avançados e corpo humano simplificado por grupos musculares.</p>
      </Surface>
    </PageFrame>
  );
}
