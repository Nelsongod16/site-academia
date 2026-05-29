"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useStore } from "zustand";
import { ArrowLeft, ChevronDown, ChevronRight, CirclePlus, FolderPlus, GripVertical, ImagePlus, MoreVertical, NotebookPen, Search, Trash2, X } from "lucide-react";

import { Button, Input } from "@/components/ui/kit";
import { useAppStore } from "@/store/app-store";
import type { Exercise, WorkoutExercise } from "@/types/app";

type ScreenMode = "list" | "builder" | "detail";

type CustomExerciseForm = {
  name: string;
  type: string;
  equipment: string;
  primaryMuscle: string;
  otherMuscles: string;
  imageDataUrl: string;
};

const emptyCustomExercise: CustomExerciseForm = {
  name: "",
  type: "",
  equipment: "",
  primaryMuscle: "",
  otherMuscles: "",
  imageDataUrl: "",
};

function toTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function initialExercise(exerciseId: string): WorkoutExercise {
  return {
    exerciseId,
    sets: 3,
    reps: "10-12",
    weight: "carga livre",
  };
}

export function TrainingScreen() {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const exercises = useStore(useAppStore, (state) => state.exercises);
  const saveWorkoutRoutine = useStore(useAppStore, (state) => state.saveWorkoutRoutine);
  const deleteWorkoutRoutine = useStore(useAppStore, (state) => state.deleteWorkoutRoutine);
  const upsertExercises = useStore(useAppStore, (state) => state.upsertExercises);

  const routineWorkouts = useMemo(() => workouts.filter((workout) => workout.kind === "gym"), [workouts]);
  const exerciseMap = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);

  const [mode, setMode] = useState<ScreenMode>("list");
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(routineWorkouts[0]?.id ?? null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineTitle, setRoutineTitle] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState("Todos os equipamentos");
  const [muscleFilter, setMuscleFilter] = useState("Todos os musculos");
  const [search, setSearch] = useState("");
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customExercise, setCustomExercise] = useState<CustomExerciseForm>(emptyCustomExercise);

  const selectedRoutine = useMemo(
    () => routineWorkouts.find((workout) => workout.id === selectedRoutineId) ?? null,
    [routineWorkouts, selectedRoutineId],
  );

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchEquipment = equipmentFilter === "Todos os equipamentos" || exercise.equipment === equipmentFilter;
      const matchMuscle = muscleFilter === "Todos os musculos" || exercise.muscle === muscleFilter;
      const query = search.trim().toLowerCase();
      const matchSearch =
        !query ||
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscle.toLowerCase().includes(query) ||
        exercise.secondaryMuscles.some((muscle) => muscle.toLowerCase().includes(query));

      return matchEquipment && matchMuscle && matchSearch;
    });
  }, [equipmentFilter, exercises, muscleFilter, search]);

  const allEquipments = useMemo(
    () => ["Todos os equipamentos", ...Array.from(new Set(exercises.map((exercise) => exercise.equipment)))],
    [exercises],
  );

  const allMuscles = useMemo(
    () => ["Todos os musculos", ...Array.from(new Set(exercises.map((exercise) => exercise.muscle)))],
    [exercises],
  );

  function openRoutineDetail(routineId: string) {
    setSelectedRoutineId(routineId);
    setMode("detail");
  }

  function openBuilder(routineId?: string) {
    if (routineId) {
      const routine = routineWorkouts.find((item) => item.id === routineId);

      if (routine) {
        setEditingRoutineId(routine.id);
        setRoutineTitle(routine.title);
        setSelectedExercises(routine.exercises);
      }
    } else {
      setEditingRoutineId(null);
      setRoutineTitle("");
      setSelectedExercises([]);
    }

    setMode("builder");
  }

  function addExerciseToDraft(exerciseId: string) {
    setSelectedExercises((current) => {
      if (current.some((item) => item.exerciseId === exerciseId)) {
        return current;
      }

      return [...current, initialExercise(exerciseId)];
    });
  }

  function removeExerciseFromDraft(exerciseId: string) {
    setSelectedExercises((current) => current.filter((item) => item.exerciseId !== exerciseId));
  }

  function updateDraftExercise(exerciseId: string, patch: Partial<WorkoutExercise>) {
    setSelectedExercises((current) =>
      current.map((item) => (item.exerciseId === exerciseId ? { ...item, ...patch } : item)),
    );
  }

  function saveRoutine() {
    const cleanTitle = toTitle(routineTitle);

    if (!cleanTitle || selectedExercises.length === 0) {
      return;
    }

    const muscleGroups = Array.from(
      new Set(
        selectedExercises.flatMap((item) => {
          const exercise = exerciseMap.get(item.exerciseId);
          return exercise ? [exercise.muscle, ...exercise.secondaryMuscles.slice(0, 1)] : [];
        }),
      ),
    );

    const routineId = saveWorkoutRoutine({
      id: editingRoutineId ?? undefined,
      title: cleanTitle,
      durationMinutes: Math.max(20, selectedExercises.length * 12),
      muscleGroups,
      exercises: selectedExercises,
    });

    setSelectedRoutineId(routineId);
    setMode("detail");
  }

  function handleCustomImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomExercise((current) => ({
        ...current,
        imageDataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  }

  function createCustomExercise() {
    const cleanName = toTitle(customExercise.name);
    const primaryMuscle = customExercise.primaryMuscle.trim().toLowerCase();

    if (!cleanName || !primaryMuscle) {
      return;
    }

    const exerciseId = `custom-${crypto.randomUUID()}`;
    const nextExercise: Exercise = {
      id: exerciseId,
      name: cleanName,
      muscle: primaryMuscle,
      secondaryMuscles: customExercise.otherMuscles
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
      category: customExercise.type.trim().toLowerCase() || "hipertrofia",
      difficulty: "iniciante",
      equipment: customExercise.equipment.trim().toLowerCase() || "livre",
      isMachine: customExercise.equipment.trim().toLowerCase() === "maquina",
      description: "Exercicio personalizado criado pela biblioteca do usuario.",
      execution: "Ajuste a execucao dentro da sua rotina conforme a necessidade do treino.",
      mediaUrl:
        customExercise.imageDataUrl ||
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      relatedIds: [],
      source: "local",
    };

    upsertExercises([nextExercise]);
    addExerciseToDraft(exerciseId);
    setCustomExercise(emptyCustomExercise);
    setCustomModalOpen(false);
  }

  function renderRoutineCard(routineId: string, title: string, subtitle: string) {
    return (
      <button
        type="button"
        onClick={() => openRoutineDetail(routineId)}
        className="flex w-full items-center gap-4 rounded-[28px] bg-white px-4 py-5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
      >
        <GripVertical className="size-5 text-[#9ca3af]" />
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold tracking-[-0.05em] text-[#111827]">{title}</p>
          <p className="mt-2 truncate text-base text-[#64748b]">{subtitle}</p>
        </div>
        <MoreVertical className="size-5 text-[#111827]" />
      </button>
    );
  }

  return (
    <section className="rounded-[34px] bg-[#f4f7fb] px-5 py-6 text-[#0f172a] shadow-[0_20px_60px_rgba(15,23,42,0.16)] sm:px-7">
      {mode === "list" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.06em]">Rotinas</h1>
            <button type="button" className="mt-8 inline-flex items-center gap-3 text-base text-[#64748b]">
              <ChevronDown className="size-4" />
              As minhas rotinas ({routineWorkouts.length})
            </button>
            <div className="mt-4 space-y-4">
              {routineWorkouts.map((routine) =>
                renderRoutineCard(
                  routine.id,
                  routine.title.toLowerCase(),
                  routine.exercises
                    .map((item) => exerciseMap.get(item.exerciseId)?.name ?? "Exercicio")
                    .slice(0, 3)
                    .join(", "),
                ),
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => openBuilder()}
              className="flex w-full items-center justify-between rounded-[28px] bg-white px-6 py-7 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-[16px] bg-[#f1f5f9]">
                  <NotebookPen className="size-5 text-[#111827]" />
                </div>
                <span className="text-2xl font-medium tracking-[-0.04em]">Nova rotina</span>
              </div>
              <ChevronRight className="size-5 text-[#64748b]" />
            </button>
            <div className="flex w-full items-center justify-between rounded-[28px] bg-white px-6 py-7 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-[16px] bg-[#f1f5f9]">
                  <FolderPlus className="size-5 text-[#111827]" />
                </div>
                <span className="text-2xl font-medium tracking-[-0.04em]">Nova pasta</span>
              </div>
              <ChevronRight className="size-5 text-[#64748b]" />
            </div>
          </div>
        </div>
      ) : null}

      {mode === "builder" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_480px]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setMode("list")} className="inline-flex items-center gap-3 text-[2rem] font-semibold tracking-[-0.06em]">
                <ArrowLeft className="size-7" />
                Criar rotina
              </button>
              <Button
                onClick={saveRoutine}
                className="rounded-[14px] bg-[#c2c8d0] px-6 text-white hover:bg-[#9aa4b2]"
                disabled={!routineTitle.trim() || selectedExercises.length === 0}
              >
                Guardar rotina
              </Button>
            </div>

            <div className="mt-8">
              <p className="text-sm font-medium text-[#111827]">Titulo da rotina</p>
              <input
                value={routineTitle}
                onChange={(event) => setRoutineTitle(event.target.value)}
                placeholder="Titulo da rotina de treino"
                className="mt-2 h-14 w-full rounded-[16px] border border-[#dbe2ea] bg-white px-5 text-lg text-[#111827] placeholder:text-[#94a3b8]"
              />
            </div>

            <div className="mt-6 min-h-[420px] rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {selectedExercises.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="grid size-16 place-items-center rounded-full bg-[#f1f5f9] text-[#94a3b8]">
                    <NotebookPen className="size-8" />
                  </div>
                  <p className="mt-6 text-3xl font-semibold tracking-[-0.05em]">Nenhum exercicio</p>
                  <p className="mt-3 max-w-md text-lg text-[#64748b]">Ate agora, nao adicionaste nenhum exercicio a esta rotina.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedExercises.map((item) => {
                    const exercise = exerciseMap.get(item.exerciseId);
                    if (!exercise) {
                      return null;
                    }

                    return (
                      <div key={item.exerciseId} className="rounded-[24px] border border-[#e2e8f0] p-5">
                        <div className="flex flex-wrap items-start gap-4">
                          <img src={exercise.mediaUrl} alt={exercise.name} className="size-16 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xl font-semibold tracking-[-0.05em]">{exercise.name}</p>
                            <p className="mt-1 text-base text-[#64748b]">{exercise.muscle}</p>
                          </div>
                          <button type="button" onClick={() => removeExerciseFromDraft(item.exerciseId)} className="text-[#ef4444]">
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <input
                            value={String(item.sets)}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { sets: Number(event.target.value || 0) })}
                            placeholder="Series"
                            className="h-12 rounded-[14px] border border-[#dbe2ea] px-4"
                          />
                          <input
                            value={item.reps}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { reps: event.target.value })}
                            placeholder="Reps"
                            className="h-12 rounded-[14px] border border-[#dbe2ea] px-4"
                          />
                          <input
                            value={item.weight}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { weight: event.target.value })}
                            placeholder="Carga"
                            className="h-12 rounded-[14px] border border-[#dbe2ea] px-4"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.05em]">Resumo</p>
                  <div className="mt-3 flex gap-8 text-lg">
                    <div>
                      <p className="text-[#64748b]">Exercicios</p>
                      <p className="text-3xl">{selectedExercises.length}</p>
                    </div>
                    <div>
                      <p className="text-[#64748b]">Total de series</p>
                      <p className="text-3xl">{selectedExercises.reduce((total, item) => total + item.sets, 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[18px] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
                  {sessionUser?.name ?? "Usuario"}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold tracking-[-0.05em]">Biblioteca</p>
                <button type="button" onClick={() => setCustomModalOpen(true)} className="inline-flex items-center gap-2 text-base text-[#0ea5e9]">
                  <CirclePlus className="size-4" />
                  Exercicio personalizado
                </button>
              </div>

              <select
                value={equipmentFilter}
                onChange={(event) => setEquipmentFilter(event.target.value)}
                className="mt-5 h-12 w-full rounded-[14px] border border-[#dbe2ea] px-4"
              >
                {allEquipments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={muscleFilter}
                onChange={(event) => setMuscleFilter(event.target.value)}
                className="mt-3 h-12 w-full rounded-[14px] border border-[#dbe2ea] px-4"
              >
                {allMuscles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-[#f1f5f9] px-4">
                <Search className="size-5 text-[#94a3b8]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Procurar exercicios"
                  className="h-12 w-full bg-transparent text-base outline-none placeholder:text-[#94a3b8]"
                />
              </div>

              <div className="mt-6 max-h-[540px] space-y-3 overflow-y-auto pr-1">
                {filteredExercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => addExerciseToDraft(exercise.id)}
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1d9bf0] text-white"
                    >
                      <CirclePlus className="size-5" />
                    </button>
                    <img src={exercise.mediaUrl} alt={exercise.name} className="size-14 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-xl font-medium tracking-[-0.04em]">{exercise.name}</p>
                      <p className="text-base text-[#64748b]">{exercise.muscle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mode === "detail" && selectedRoutine ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <button type="button" onClick={() => setMode("list")} className="inline-flex items-center gap-3 text-[2rem] font-semibold tracking-[-0.06em]">
              <ArrowLeft className="size-7" />
              {selectedRoutine.title.toLowerCase()}
            </button>

            <div className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="space-y-5">
                {selectedRoutine.exercises.map((item) => {
                  const exercise = exerciseMap.get(item.exerciseId);
                  if (!exercise) {
                    return null;
                  }

                  return (
                    <div key={item.exerciseId} className="flex items-center gap-4">
                      <img src={exercise.mediaUrl} alt={exercise.name} className="size-16 rounded-full object-cover" />
                      <div>
                        <p className="text-2xl font-semibold tracking-[-0.05em]">{exercise.name}</p>
                        <p className="mt-1 text-lg">{item.sets} set</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-4">
                {sessionUser?.avatarImage ? (
                  <img src={sessionUser.avatarImage} alt={sessionUser.name} className="size-14 rounded-full object-cover" />
                ) : (
                  <div className="grid size-14 place-items-center rounded-full bg-[#e5e7eb] text-lg font-semibold text-[#64748b]">
                    {sessionUser?.avatar ?? "PS"}
                  </div>
                )}
                <div>
                  <p className="text-base text-[#64748b]">Criada por</p>
                  <p className="text-2xl font-semibold tracking-[-0.05em]">{sessionUser?.username?.replace(/^@/, "") ?? sessionUser?.name ?? "usuario"}</p>
                </div>
              </div>
              <Button onClick={() => openBuilder(selectedRoutine.id)} className="mt-5 w-full rounded-[14px] bg-[#1d9bf0] text-white">
                Editar rotina
              </Button>
              <Button variant="secondary" className="mt-3 w-full rounded-[14px] bg-[#f1f5f9] text-[#111827] hover:bg-[#e2e8f0]">
                Copiar ligacao da rotina
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  deleteWorkoutRoutine(selectedRoutine.id);
                  setMode("list");
                }}
                className="mt-3 w-full rounded-[14px] text-[#ef4444] hover:bg-[#fee2e2]"
              >
                Excluir rotina
              </Button>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <p className="text-2xl font-semibold tracking-[-0.05em]">Resumo da rotina</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-base">
                <div>
                  <p className="text-[#64748b]">Exercicios</p>
                  <p className="text-3xl">{selectedRoutine.exercises.length}</p>
                </div>
                <div>
                  <p className="text-[#64748b]">Total de series</p>
                  <p className="text-3xl">{selectedRoutine.exercises.reduce((total, item) => total + item.sets, 0)}</p>
                </div>
                <div>
                  <p className="text-[#64748b]">Duracao estimada</p>
                  <p className="text-3xl">{selectedRoutine.durationMinutes} min</p>
                </div>
              </div>

              <div className="mt-6 rounded-[20px] bg-[#f8fafc] p-4">
                {selectedRoutine.muscleGroups.slice(0, 3).map((muscle, index) => (
                  <div key={muscle} className="mt-3 first:mt-0">
                    <div className="flex items-center justify-between text-base">
                      <span className="capitalize">{muscle}</span>
                      <span>{Math.max(1, selectedRoutine.exercises.length - index)}</span>
                    </div>
                    <div className="mt-2 h-5 rounded-full bg-[#dbeafe]">
                      <div
                        className="h-5 rounded-full bg-[#1d9bf0]"
                        style={{ width: `${Math.max(35, 100 - index * 20)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {customModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-[26px] bg-white p-6 text-[#111827] shadow-[0_24px_80px_rgba(15,23,42,0.26)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[2rem] font-semibold tracking-[-0.05em]">Criar exercicio personalizado</h2>
              <button type="button" onClick={() => setCustomModalOpen(false)}>
                <X className="size-6" />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center border-t border-[#e5e7eb] pt-6">
              <label className="grid size-32 cursor-pointer place-items-center rounded-full bg-[#f8fafc] text-[#94a3b8]">
                {customExercise.imageDataUrl ? (
                  <img src={customExercise.imageDataUrl} alt="Preview" className="size-32 rounded-full object-cover" />
                ) : (
                  <ImagePlus className="size-10" />
                )}
                <input type="file" accept="image/*" onChange={handleCustomImage} className="hidden" />
              </label>
              <label className="mt-4 inline-flex cursor-pointer rounded-[14px] bg-[#eef2f7] px-5 py-3 text-lg">
                Adicionar imagem
                <input type="file" accept="image/*" onChange={handleCustomImage} className="hidden" />
              </label>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-base font-medium">Nome do exercicio</p>
                <Input
                  value={customExercise.name}
                  onChange={(event) => setCustomExercise((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Introduz o nome do exercicio..."
                  className="h-12 rounded-[14px] border border-[#dbe2ea] bg-white text-[#111827] placeholder:text-[#94a3b8]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-base font-medium">Tipo de Exercicio</p>
                  <Input
                    value={customExercise.type}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, type: event.target.value }))}
                    placeholder="Select..."
                    className="h-12 rounded-[14px] border border-[#dbe2ea] bg-white text-[#111827] placeholder:text-[#94a3b8]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-base font-medium">Equipamento</p>
                  <Input
                    value={customExercise.equipment}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, equipment: event.target.value }))}
                    placeholder="Select..."
                    className="h-12 rounded-[14px] border border-[#dbe2ea] bg-white text-[#111827] placeholder:text-[#94a3b8]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-base font-medium">Grupo Muscular Primario</p>
                  <Input
                    value={customExercise.primaryMuscle}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, primaryMuscle: event.target.value }))}
                    placeholder="Select..."
                    className="h-12 rounded-[14px] border border-[#dbe2ea] bg-white text-[#111827] placeholder:text-[#94a3b8]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-base font-medium">Outros Musculos</p>
                  <Input
                    value={customExercise.otherMuscles}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, otherMuscles: event.target.value }))}
                    placeholder="Select..."
                    className="h-12 rounded-[14px] border border-[#dbe2ea] bg-white text-[#111827] placeholder:text-[#94a3b8]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={createCustomExercise}
                className="rounded-[14px] bg-[#c2c8d0] px-6 text-white hover:bg-[#9aa4b2]"
                disabled={!customExercise.name.trim() || !customExercise.primaryMuscle.trim()}
              >
                Criar exercicio
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
