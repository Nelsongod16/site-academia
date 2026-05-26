"use client";

import { AnimatePresence, motion } from "framer-motion";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, Copy, Plus, Search, Sparkles, StretchHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Chip, Input, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { cn, formatDuration } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { Exercise, WorkoutExercise, WorkoutKind } from "@/types/app";

const muscleGroupOptions = ["peito", "ombro", "triceps", "costas", "biceps", "quadriceps", "gluteo", "posterior", "cardio"];

type BuilderConfig = {
  sets: number;
  reps: string;
  weight: string;
  note: string;
};

function matchesGroup(exercise: Exercise, group: string) {
  return (
    exercise.muscle.toLowerCase().includes(group.toLowerCase()) ||
    exercise.secondaryMuscles.some((item) => item.toLowerCase().includes(group.toLowerCase()))
  );
}

function WorkoutExerciseCard({
  id,
  detail,
  exercise,
  index,
  total,
  onChange,
}: {
  id: string;
  detail: Exercise;
  exercise: WorkoutExercise;
  index: number;
  total: number;
  onChange: (patch: Partial<WorkoutExercise>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="overflow-hidden rounded-[18px] border border-white/6 bg-white/[0.03]"
    >
      <div className="grid md:grid-cols-[132px_1fr]">
        <img src={detail.mediaUrl} alt={detail.name} className="h-full min-h-[138px] w-full object-cover" />
        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                bloco {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em]">{detail.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {detail.muscle} / {detail.equipment}
              </p>
            </div>

            <button className="rounded-[14px] bg-white/6 p-3 text-[var(--muted)]" {...attributes} {...listeners}>
              <StretchHorizontal className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input value={String(exercise.sets)} onChange={(event) => onChange({ sets: Number(event.target.value) || 0 })} placeholder="Series" />
            <Input value={exercise.reps} onChange={(event) => onChange({ reps: event.target.value })} placeholder="Reps" />
            <Input value={exercise.weight} onChange={(event) => onChange({ weight: event.target.value })} placeholder="Carga" />
          </div>

          <Input value={exercise.note ?? ""} onChange={(event) => onChange({ note: event.target.value })} placeholder="Observacao" />

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>progresso do bloco</span>
              <span>{Math.round(((index + 1) / Math.max(total, 1)) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/6">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.round(((index + 1) / Math.max(total, 1)) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuilderExerciseCard({
  exercise,
  selected,
  config,
  onToggle,
  onChange,
}: {
  exercise: Exercise;
  selected: boolean;
  config?: BuilderConfig;
  onToggle: () => void;
  onChange: (patch: Partial<BuilderConfig>) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/6 bg-white/[0.03]">
      <div className="grid grid-cols-[112px_1fr]">
        <img src={exercise.mediaUrl} alt={exercise.name} className="h-full min-h-[144px] w-full object-cover" />
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-[-0.03em]">{exercise.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                {exercise.muscle} / {exercise.equipment}
              </p>
            </div>
            <button
              onClick={onToggle}
              className={cn(
                "rounded-[12px] px-3 py-2 text-xs uppercase tracking-[0.18em] transition",
                selected ? "bg-white text-black" : "bg-white/6 text-white",
              )}
            >
              {selected ? "remover" : "adicionar"}
            </button>
          </div>

          {selected ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Input value={String(config?.sets ?? 3)} onChange={(event) => onChange({ sets: Number(event.target.value) || 0 })} placeholder="Series" />
                <Input value={config?.reps ?? "10-12"} onChange={(event) => onChange({ reps: event.target.value })} placeholder="Reps" />
                <Input value={config?.weight ?? "carga livre"} onChange={(event) => onChange({ weight: event.target.value })} placeholder="Carga" />
              </div>
              <Input value={config?.note ?? ""} onChange={(event) => onChange({ note: event.target.value })} placeholder="Observacao" />
            </div>
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">{exercise.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrainingScreen() {
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const exercises = useStore(useAppStore, (state) => state.exercises);
  const favoriteExerciseIds = useStore(useAppStore, (state) => state.favoriteExerciseIds);
  const recentExerciseIds = useStore(useAppStore, (state) => state.recentExerciseIds);
  const toggleWorkoutCompleted = useStore(useAppStore, (state) => state.toggleWorkoutCompleted);
  const addWorkoutNote = useStore(useAppStore, (state) => state.addWorkoutNote);
  const duplicateWorkout = useStore(useAppStore, (state) => state.duplicateWorkout);
  const duplicateLastWeek = useStore(useAppStore, (state) => state.duplicateLastWeek);
  const addCustomWorkout = useStore(useAppStore, (state) => state.addCustomWorkout);
  const reorderWorkoutExercises = useStore(useAppStore, (state) => state.reorderWorkoutExercises);
  const updateWorkoutExercise = useStore(useAppStore, (state) => state.updateWorkoutExercise);
  const addExercisesToWorkout = useStore(useAppStore, (state) => state.addExercisesToWorkout);
  const quickWorkoutId = useStore(useAppStore, (state) => state.quickWorkoutId);
  const setQuickWorkout = useStore(useAppStore, (state) => state.setQuickWorkout);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("60");
  const [newKind, setNewKind] = useState<WorkoutKind>("gym");
  const [newGroups, setNewGroups] = useState<string[]>(["peito", "ombro", "triceps"]);
  const [builderSearch, setBuilderSearch] = useState("");
  const [builderExercises, setBuilderExercises] = useState<Record<string, BuilderConfig>>({});

  const sensors = useSensors(useSensor(PointerSensor));
  const selectedWorkout = workouts.find((workout) => workout.id === quickWorkoutId) ?? workouts[0];
  const selectedWorkoutDetails = selectedWorkout?.exercises
    .map((exercise) => ({
      detail: exercises.find((item) => item.id === exercise.exerciseId),
      record: exercise,
    }))
    .filter((item): item is { detail: Exercise; record: WorkoutExercise } => Boolean(item.detail));

  const currentHeroImage = selectedWorkoutDetails?.[0]?.detail.mediaUrl ?? exercises[0]?.mediaUrl;
  const completionRatio = selectedWorkout?.completed
    ? 100
    : Math.min(94, 28 + (selectedWorkout?.exercises.length ?? 0) * 18);
  const favoriteExercises = exercises.filter((exercise) => favoriteExerciseIds.includes(exercise.id)).slice(0, 4);
  const recentExercises = exercises.filter((exercise) => recentExerciseIds.includes(exercise.id)).slice(0, 4);
  const builderSelectionCount = Object.keys(builderExercises).length;

  const builderCandidates = useMemo(() => {
    const query = builderSearch.trim().toLowerCase();
    const filtered = exercises.filter((exercise) => {
      if (newKind === "gym") {
        if (!newGroups.length) {
          return false;
        }

        const groupMatch = newGroups.some((group) => matchesGroup(exercise, group));
        if (!groupMatch) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      return `${exercise.name} ${exercise.muscle} ${exercise.description}`.toLowerCase().includes(query);
    });

    return filtered.sort((a, b) => Number(Boolean(builderExercises[b.id])) - Number(Boolean(builderExercises[a.id])));
  }, [builderExercises, builderSearch, exercises, newGroups, newKind]);

  function toggleGroup(group: string) {
    setNewGroups((state) => (state.includes(group) ? state.filter((item) => item !== group) : [...state, group]));
  }

  function toggleBuilderExercise(exerciseId: string) {
    setBuilderExercises((state) => {
      if (state[exerciseId]) {
        const nextState = { ...state };
        delete nextState[exerciseId];
        return nextState;
      }

      return {
        ...state,
        [exerciseId]: {
          sets: 3,
          reps: "10-12",
          weight: "carga livre",
          note: "",
        },
      };
    });
  }

  function handleCreateWorkout() {
    const title = newTitle.trim();
    if (!title) {
      return;
    }

    const muscleGroups = newKind === "gym" ? newGroups : ["cardio"];
    const builtExercises = Object.entries(builderExercises).map(([exerciseId, config]) => ({
      exerciseId,
      sets: config.sets,
      reps: config.reps,
      weight: config.weight,
      note: config.note,
    }));

    if (newKind === "gym" && builtExercises.length === 0) {
      return;
    }

    addCustomWorkout({
      title,
      kind: newKind,
      durationMinutes: Number(newDuration) || 45,
      muscleGroups: muscleGroups.length ? muscleGroups : ["cardio"],
      exercises: builtExercises,
    });

    setNewTitle("");
    setNewDuration("60");
    setBuilderSearch("");
    setBuilderExercises({});
    setNewGroups(["peito", "ombro", "triceps"]);
  }

  if (!selectedWorkout) {
    return null;
  }

  return (
    <PageFrame className="gap-5">
      <StrongSurface className="overflow-hidden rounded-[24px] p-0">
        <div className="relative min-h-[340px]">
          <img src={currentHeroImage} alt={selectedWorkout.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="cinema-overlay absolute inset-0" />
          <div className="relative flex min-h-[340px] flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/80">
                treino atual
              </div>
              <AnimatePresence mode="wait">
                {selectedWorkout.completed ? (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]"
                  >
                    <CheckCircle2 className="size-4" />
                    concluido
                  </motion.div>
                ) : (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-full bg-black/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/72"
                  >
                    progresso em curso
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-5">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">{selectedWorkout.label}</p>
                <h2 className="mt-2 text-4xl font-semibold tracking-[-0.08em]">{selectedWorkout.title}</h2>
                <p className="mt-3 text-sm text-white/72">
                  {formatDuration(selectedWorkout.durationMinutes)} / {selectedWorkout.exercises.length} exercicios / {selectedWorkout.muscleGroups.join(" / ")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/68">
                  <span>progresso visual</span>
                  <span>{completionRatio}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRatio}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant={selectedWorkout.completed ? "secondary" : "primary"} onClick={() => toggleWorkoutCompleted(selectedWorkout.id)}>
                  {selectedWorkout.completed ? "Treino concluido" : "Concluir treino"}
                </Button>
                <Button variant="secondary" onClick={() => duplicateWorkout(selectedWorkout.id)} className="gap-2">
                  <Copy className="size-4" />
                  Duplicar
                </Button>
                <Button variant="ghost" onClick={() => duplicateLastWeek()}>
                  Repetir semana passada
                </Button>
              </div>
            </div>
          </div>
        </div>
      </StrongSurface>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {workouts.map((workout) => {
          const cover = exercises.find((exercise) => exercise.id === workout.exercises[0]?.exerciseId)?.mediaUrl ?? currentHeroImage;

          return (
            <button
              key={workout.id}
              onClick={() => {
                setQuickWorkout(workout.id);
              }}
              className={cn(
                "relative min-h-[180px] min-w-[210px] overflow-hidden rounded-[20px] border border-white/7 text-left",
                workout.id === selectedWorkout.id ? "ring-1 ring-[var(--accent)]" : "",
              )}
            >
              <img src={cover} alt={workout.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="cinema-overlay absolute inset-0" />
              <div className="relative flex min-h-[180px] flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/72">
                    {workout.kind}
                  </span>
                  {workout.completed ? <CheckCircle2 className="size-4 text-[var(--accent)]" /> : null}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">{workout.label}</p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.05em]">{workout.title}</p>
                  <p className="mt-2 text-sm text-white/72">{workout.muscleGroups.join(" / ")}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <StrongSurface className="rounded-[22px]">
        <SectionHeading eyebrow="smart builder" title="Criar treino por grupo muscular" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Ex: Upper focado em peito" />
              <Input value={newDuration} onChange={(event) => setNewDuration(event.target.value)} placeholder="Duracao em minutos" />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["gym", "run", "swim"] as const).map((kind) => (
                <Chip key={kind} active={newKind === kind} onClick={() => setNewKind(kind)}>
                  {kind}
                </Chip>
              ))}
            </div>

            {newKind === "gym" ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--muted)]">
                  Escolha grupos musculares e o sistema sugere exercicios com imagem, carga, reps, series e observacoes.
                </p>
                <div className="flex flex-wrap gap-2">
                  {muscleGroupOptions.map((group) => (
                    <Chip key={group} active={newGroups.includes(group)} onClick={() => toggleGroup(group)}>
                      {group}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] bg-white/4 p-4 text-sm text-[var(--muted)]">
                Para corrida e natacao, crie um bloco rapido e deixe o feed receber a sessao depois.
              </div>
            )}

            <div className="flex items-center gap-2 rounded-[16px] bg-white/4 px-4 py-3">
              <Search className="size-4 text-[var(--muted)]" />
              <input
                value={builderSearch}
                onChange={(event) => setBuilderSearch(event.target.value)}
                placeholder="Buscar exercicio dentro do construtor"
                className="w-full bg-transparent text-sm text-white placeholder:text-[var(--muted)]"
              />
            </div>

            <div className="rounded-[18px] bg-white/4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">selecionados</p>
                  <p className="mt-2 text-lg font-semibold">{builderSelectionCount} exercicios no treino</p>
                </div>
                <Button onClick={handleCreateWorkout} className="gap-2" disabled={!newTitle.trim() || (newKind === "gym" && builderSelectionCount === 0)}>
                  <Plus className="size-4" />
                  Criar treino
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {builderCandidates.length ? (
              builderCandidates.map((exercise) => (
                <BuilderExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  selected={Boolean(builderExercises[exercise.id])}
                  config={builderExercises[exercise.id]}
                  onToggle={() => toggleBuilderExercise(exercise.id)}
                  onChange={(patch) =>
                    setBuilderExercises((state) => ({
                      ...state,
                      [exercise.id]: {
                        ...state[exercise.id],
                        ...patch,
                      },
                    }))
                  }
                />
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/10 bg-white/3 p-6 text-sm text-[var(--muted)]">
                Selecione grupos musculares para liberar sugestoes relacionadas.
              </div>
            )}
          </div>
        </div>
      </StrongSurface>

      <Surface className="rounded-[22px]">
        <SectionHeading eyebrow="in session" title="Exercicios do treino atual" />
        <Input
          className="mt-4"
          value={selectedWorkout.quickNote ?? ""}
          onChange={(event) => addWorkoutNote(selectedWorkout.id, event.target.value)}
          placeholder="Observacao geral do treino"
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (!over || active.id === over.id) {
              return;
            }

            const items = selectedWorkout.exercises.map((exercise) => exercise.exerciseId);
            const oldIndex = items.indexOf(String(active.id));
            const newIndex = items.indexOf(String(over.id));
            reorderWorkoutExercises(selectedWorkout.id, arrayMove(items, oldIndex, newIndex));
          }}
        >
          <SortableContext items={selectedWorkout.exercises.map((exercise) => exercise.exerciseId)} strategy={verticalListSortingStrategy}>
            <div className="mt-4 space-y-3">
              {selectedWorkoutDetails?.map(({ detail, record }, index) => (
                <WorkoutExerciseCard
                  key={record.exerciseId}
                  id={record.exerciseId}
                  detail={detail}
                  exercise={record}
                  index={index}
                  total={selectedWorkout.exercises.length}
                  onChange={(patch) => updateWorkoutExercise(selectedWorkout.id, record.exerciseId, patch)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="favoritos" title="Adicionar rapido" />
          <div className="mt-4 space-y-3">
            {favoriteExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => addExercisesToWorkout(selectedWorkout.id, [exercise.id])}
                className="flex w-full items-center gap-3 rounded-[16px] bg-white/4 p-3 text-left transition hover:bg-white/6"
              >
                <img src={exercise.mediaUrl} alt={exercise.name} className="size-14 rounded-[14px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{exercise.muscle}</p>
                </div>
                <Plus className="size-4 text-[var(--accent)]" />
              </button>
            ))}
          </div>
        </Surface>

        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="recentes" title="Sugestoes quentes" />
          <div className="mt-4 space-y-3">
            {recentExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => addExercisesToWorkout(selectedWorkout.id, [exercise.id])}
                className="flex w-full items-center gap-3 rounded-[16px] bg-white/4 p-3 text-left transition hover:bg-white/6"
              >
                <img src={exercise.mediaUrl} alt={exercise.name} className="size-14 rounded-[14px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{exercise.equipment}</p>
                </div>
                <Plus className="size-4 text-[var(--accent)]" />
              </button>
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="flex items-center gap-3 rounded-[18px] bg-white/4">
        <Sparkles className="size-4 text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">
          Biblioteca removida da navegação. Agora o treino nasce dentro do construtor com imagem, carga, reps, series e observacoes.
        </p>
      </Surface>
    </PageFrame>
  );
}
