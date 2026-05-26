"use client";

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sparkles, StretchHorizontal, Copy, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Chip, Input, SectionHeading, StrongSurface, Surface, Textarea } from "@/components/ui/kit";
import { formatDuration } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

function SortableExercise({
  id,
  name,
  sets,
  reps,
  weight,
  note,
  onChange,
}: {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  note?: string;
  onChange: (patch: { sets?: number; reps?: string; weight?: string; note?: string }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-[22px] border border-white/8 bg-white/4 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Ultima carga salva visivel no card.</p>
        </div>
        <button className="rounded-full border border-white/8 bg-white/4 p-2 text-[var(--muted)]" {...attributes} {...listeners}>
          <StretchHorizontal className="size-4" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Input value={String(sets)} onChange={(event) => onChange({ sets: Number(event.target.value) || 0 })} />
        <Input value={reps} onChange={(event) => onChange({ reps: event.target.value })} />
        <Input value={weight} onChange={(event) => onChange({ weight: event.target.value })} />
      </div>
      <Input className="mt-2" value={note ?? ""} onChange={(event) => onChange({ note: event.target.value })} placeholder="Nota rapida" />
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
  const reorderWorkoutExercises = useStore(useAppStore, (state) => state.reorderWorkoutExercises);
  const updateWorkoutExercise = useStore(useAppStore, (state) => state.updateWorkoutExercise);
  const addExercisesToWorkout = useStore(useAppStore, (state) => state.addExercisesToWorkout);
  const quickWorkoutId = useStore(useAppStore, (state) => state.quickWorkoutId);
  const setQuickWorkout = useStore(useAppStore, (state) => state.setQuickWorkout);
  const [selectedId, setSelectedId] = useState(quickWorkoutId ?? workouts[0]?.id);

  const sensors = useSensors(useSensor(PointerSensor));
  const selectedWorkout = workouts.find((workout) => workout.id === selectedId) ?? workouts[0];
  const favoriteExercises = exercises.filter((exercise) => favoriteExerciseIds.includes(exercise.id)).slice(0, 6);
  const recentExercises = exercises.filter((exercise) => recentExerciseIds.includes(exercise.id)).slice(0, 6);

  const progress = useMemo(() => {
    const done = workouts.filter((workout) => workout.completed).length;
    return Math.round((done / Math.max(workouts.length, 1)) * 100);
  }, [workouts]);

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="treino semanal" title="Semana organizada" />
        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max gap-3">
            {workouts.map((workout) => (
              <button
                key={workout.id}
                onClick={() => {
                  setSelectedId(workout.id);
                  setQuickWorkout(workout.id);
                }}
                className={`min-w-[168px] rounded-[22px] border p-4 text-left transition ${
                  workout.id === selectedWorkout.id ? "border-white/30 bg-white/10" : "border-white/8 bg-white/4"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{workout.label}</p>
                  {workout.completed ? <CheckCircle2 className="size-4 text-[var(--accent)]" /> : null}
                </div>
                <p className="mt-2 text-lg font-semibold">{workout.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{workout.muscleGroups.join(" · ")}</p>
                <div className="mt-4 h-1.5 rounded-full bg-white/6">
                  <div className="h-full rounded-full" style={{ width: `${workout.completed ? 100 : 52}%`, background: workout.color }} />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/4 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">progresso semanal</p>
          <div className="mt-2 h-2 rounded-full bg-white/6">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </StrongSurface>

      <Surface className="rounded-[28px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">treino do dia</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{selectedWorkout.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {formatDuration(selectedWorkout.durationMinutes)} · {selectedWorkout.exercises.length} exercicios · {selectedWorkout.muscleGroups.join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedWorkout.completed ? "secondary" : "primary"} onClick={() => toggleWorkoutCompleted(selectedWorkout.id)}>
              {selectedWorkout.completed ? "Concluido" : "Marcar concluido"}
            </Button>
            <Button variant="secondary" onClick={() => duplicateWorkout(selectedWorkout.id)} className="gap-2">
              <Copy className="size-4" />
              Copiar
            </Button>
            <Button variant="ghost" onClick={() => duplicateLastWeek()}>
              Duplicar semana passada
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedWorkout.tags.map((tag) => (
            <Chip key={tag} active>
              {tag}
            </Chip>
          ))}
        </div>

        <Textarea
          className="mt-4"
          value={selectedWorkout.quickNote ?? ""}
          onChange={(event) => addWorkoutNote(selectedWorkout.id, event.target.value)}
          placeholder="Observacao rapida do treino"
        />
      </Surface>

      <Surface className="rounded-[28px]">
        <SectionHeading eyebrow="tempo real" title="Exercicios do treino" />
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
              {selectedWorkout.exercises.map((exercise) => {
                const detail = exercises.find((item) => item.id === exercise.exerciseId);
                if (!detail) {
                  return null;
                }

                return (
                  <SortableExercise
                    key={exercise.exerciseId}
                    id={exercise.exerciseId}
                    name={detail.name}
                    sets={exercise.sets}
                    reps={exercise.reps}
                    weight={exercise.weight}
                    note={exercise.note}
                    onChange={(patch) => updateWorkoutExercise(selectedWorkout.id, exercise.exerciseId, patch)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="favoritos" title="Adicionar rapido" />
          <div className="mt-4 flex flex-wrap gap-2">
            {favoriteExercises.map((exercise) => (
              <Chip key={exercise.id} onClick={() => addExercisesToWorkout(selectedWorkout.id, [exercise.id])}>
                {exercise.name}
              </Chip>
            ))}
          </div>
        </Surface>
        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="ultimos usados" title="Sugestoes relacionadas" />
          <div className="mt-4 flex flex-wrap gap-2">
            {recentExercises.map((exercise) => (
              <Chip key={exercise.id} onClick={() => addExercisesToWorkout(selectedWorkout.id, [exercise.id])}>
                {exercise.name}
              </Chip>
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="flex items-center gap-3 rounded-[22px]">
        <Sparkles className="size-4 text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">Swipe horizontal entre dias, drag and drop nos exercicios e feedback visual ao salvar.</p>
      </Surface>
    </PageFrame>
  );
}
