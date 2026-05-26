"use client";

import { Heart, PlayCircle, Search, Sparkles } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Chip, StrongSurface, Surface } from "@/components/ui/kit";
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
  const [selectedId, setSelectedId] = useState(exercises[0]?.id ?? "");
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

  const selectedExercise = filtered.find((exercise) => exercise.id === selectedId) ?? filtered[0] ?? exercises[0];

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">biblioteca</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Exercicios com video</h2>
          </div>
          <div className="rounded-[18px] bg-white/6 px-4 py-3 text-sm text-[var(--muted)]">{filtered.length} encontrados</div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-[20px] bg-white/6 px-4 py-3">
          <Search className="size-4 text-[var(--muted)]" />
          <input
            value={search}
            onChange={(event) => startTransition(() => setSearch(event.target.value))}
            placeholder="Buscar por nome, execucao ou grupo muscular"
            className="w-full bg-transparent text-sm placeholder:text-[var(--muted)]"
          />
        </div>
      </StrongSurface>

      {selectedExercise ? (
        <StrongSurface className="overflow-hidden rounded-[32px] p-0">
          <div className="grid md:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-black">
              {selectedExercise.videoUrl ? (
                <video controls playsInline poster={selectedExercise.mediaUrl} className="h-full min-h-[260px] w-full object-cover">
                  <source src={selectedExercise.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <img src={selectedExercise.mediaUrl} alt={selectedExercise.name} className="h-full min-h-[260px] w-full object-cover" />
              )}
            </div>
            <div className="space-y-4 p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                <PlayCircle className="size-3.5" />
                video da execucao
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.06em]">{selectedExercise.name}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {selectedExercise.muscle} · {selectedExercise.equipment} · {selectedExercise.difficulty}
                </p>
              </div>
              <p className="text-sm leading-6 text-[var(--muted)]">{selectedExercise.description}</p>
              <div className="rounded-[22px] bg-white/6 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">execucao</p>
                <p className="mt-2 text-sm">{selectedExercise.execution}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedExercise.secondaryMuscles.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            </div>
          </div>
        </StrongSurface>
      ) : null}

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
              <button onClick={() => setSelectedId(exercise.id)} className="block w-full text-left">
                <div className="relative">
                  <img src={exercise.mediaUrl} alt={exercise.name} className="h-48 w-full object-cover" loading="lazy" />
                  <div className="absolute right-4 bottom-4 rounded-full bg-black/55 p-3 text-white">
                    <PlayCircle className="size-5" />
                  </div>
                </div>
              </button>
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
                    className={`rounded-full p-2 ${favorite ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-white/6 text-[var(--muted)]"}`}
                  >
                    <Heart className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-[var(--muted)]">{exercise.description}</p>
                <p className="text-sm">{exercise.execution}</p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => quickWorkoutId && addExercisesToWorkout(quickWorkoutId, [exercise.id])}
                    className="flex-1"
                    variant={quickWorkoutId ? "primary" : "secondary"}
                  >
                    {quickWorkoutId ? "Adicionar ao treino" : "Abra um treino primeiro"}
                  </Button>
                  <div className="rounded-[16px] bg-white/6 px-3 py-3 text-xs text-[var(--muted)]">{exercise.category}</div>
                </div>

                <div className="rounded-[18px] bg-white/4 px-4 py-3">
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

      <Surface className="flex items-center gap-3 rounded-[22px] bg-white/5">
        <Sparkles className="size-4 text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">Biblioteca com preview em video, filtros rapidos e atalhos para colocar exercicios direto no treino.</p>
      </Surface>
    </PageFrame>
  );
}
