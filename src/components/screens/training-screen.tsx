"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  FolderPlus,
  ImagePlus,
  Link2,
  MoreVertical,
  NotebookPen,
  PencilLine,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "zustand";

import { Button, Input } from "@/components/ui/kit";
import { fetchExerciseCatalog } from "@/services/exerciseService";
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

function darkFieldClasses() {
  return "h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40";
}

export function TrainingScreen() {
  const searchParams = useSearchParams();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const exercises = useStore(useAppStore, (state) => state.exercises);
  const saveWorkoutRoutine = useStore(useAppStore, (state) => state.saveWorkoutRoutine);
  const deleteWorkoutRoutine = useStore(useAppStore, (state) => state.deleteWorkoutRoutine);
  const upsertExercises = useStore(useAppStore, (state) => state.upsertExercises);

  const routineWorkouts = useMemo(() => workouts.filter((workout) => workout.kind === "gym"), [workouts]);

  const [mode, setMode] = useState<ScreenMode>("list");
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(routineWorkouts[0]?.id ?? null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineTitle, setRoutineTitle] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState("Todos os equipamentos");
  const [muscleFilter, setMuscleFilter] = useState("Todos os musculos");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customExercise, setCustomExercise] = useState<CustomExerciseForm>(emptyCustomExercise);
  const [menuRoutineId, setMenuRoutineId] = useState<string | null>(null);
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);
  const [catalogExercises, setCatalogExercises] = useState<Exercise[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [catalogError, setCatalogError] = useState("");
  const [catalogRequestKey, setCatalogRequestKey] = useState(0);

  const localExercises = useMemo(() => exercises.filter((exercise) => exercise.source === "local"), [exercises]);
  const libraryExercises = useMemo(() => {
    const catalogMap = new Map<string, Exercise>();

    catalogExercises.forEach((exercise) => {
      catalogMap.set(exercise.id, exercise);
    });

    localExercises.forEach((exercise) => {
      catalogMap.set(exercise.id, exercise);
    });

    return Array.from(catalogMap.values());
  }, [catalogExercises, localExercises]);

  const selectedRoutine = useMemo(
    () => routineWorkouts.find((workout) => workout.id === selectedRoutineId) ?? null,
    [routineWorkouts, selectedRoutineId],
  );

  const exerciseMap = useMemo(() => {
    const nextMap = new Map<string, Exercise>();

    exercises.forEach((exercise) => {
      nextMap.set(exercise.id, exercise);
    });

    catalogExercises.forEach((exercise) => {
      nextMap.set(exercise.id, exercise);
    });

    return nextMap;
  }, [catalogExercises, exercises]);

  const filteredExercises = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return [...libraryExercises]
      .filter((exercise) => {
        const matchEquipment = equipmentFilter === "Todos os equipamentos" || exercise.equipment === equipmentFilter;
        const matchMuscle = muscleFilter === "Todos os musculos" || exercise.muscle === muscleFilter;
        const matchSearch =
          !query ||
          exercise.name.toLowerCase().includes(query) ||
          exercise.muscle.toLowerCase().includes(query) ||
          exercise.secondaryMuscles.some((muscle) => muscle.toLowerCase().includes(query));

        return matchEquipment && matchMuscle && matchSearch;
      })
      .sort((left, right) => {
        if (left.source === "local" && right.source !== "local") {
          return -1;
        }

        if (right.source === "local" && left.source !== "local") {
          return 1;
        }

        return left.name.localeCompare(right.name, "pt-BR");
      });
  }, [deferredSearch, equipmentFilter, libraryExercises, muscleFilter]);

  const allEquipments = useMemo(
    () => ["Todos os equipamentos", ...Array.from(new Set(libraryExercises.map((exercise) => exercise.equipment))).sort((left, right) => left.localeCompare(right, "pt-BR"))],
    [libraryExercises],
  );

  const allMuscles = useMemo(
    () => ["Todos os musculos", ...Array.from(new Set(libraryExercises.map((exercise) => exercise.muscle))).sort((left, right) => left.localeCompare(right, "pt-BR"))],
    [libraryExercises],
  );

  useEffect(() => {
    if (!searchParams) {
      return;
    }

    const routineId = searchParams.get("routine");

    if (!routineId) {
      return;
    }

    if (!routineWorkouts.some((routine) => routine.id === routineId)) {
      return;
    }

    startTransition(() => {
      setSelectedRoutineId(routineId);
      setMode("detail");
    });
  }, [routineWorkouts, searchParams]);

  useEffect(() => {
    if (!menuRoutineId) {
      return;
    }

    function handleCloseMenu() {
      setMenuRoutineId(null);
    }

    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, [menuRoutineId]);

  useEffect(() => {
    if (!copiedRoutineId) {
      return;
    }

    const timer = window.setTimeout(() => setCopiedRoutineId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedRoutineId]);

  useEffect(() => {
    if (mode !== "builder") {
      return;
    }

    if (catalogRequestKey === 0 && catalogExercises.length > 0) {
      return;
    }

    const controller = new AbortController();

    setCatalogStatus("loading");
    setCatalogError("");

    fetchExerciseCatalog({ signal: controller.signal })
      .then((items) => {
        setCatalogExercises(items);
        setCatalogStatus("success");
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setCatalogExercises([]);
        setCatalogStatus("error");
        setCatalogError(error?.response?.data?.message ?? "Nao foi possivel carregar a biblioteca completa agora.");
      });

    return () => controller.abort();
  }, [catalogExercises.length, catalogRequestKey, mode]);

  function replaceTrainingUrl(routineId?: string) {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = routineId ? `/training?routine=${encodeURIComponent(routineId)}` : "/training";
    window.history.replaceState({}, "", nextUrl);
  }

  function openRoutineDetail(routineId: string) {
    setSelectedRoutineId(routineId);
    setMenuRoutineId(null);
    setMode("detail");
    replaceTrainingUrl(routineId);
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

    setMenuRoutineId(null);
    setMode("builder");
    replaceTrainingUrl();
  }

  function addExerciseToDraft(exerciseId: string) {
    setSelectedExercises((current) => {
      if (current.some((item) => item.exerciseId === exerciseId)) {
        return current;
      }

      return [...current, initialExercise(exerciseId)];
    });
  }

  function addLibraryExercise(exercise: Exercise) {
    upsertExercises([exercise]);
    addExerciseToDraft(exercise.id);
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
    replaceTrainingUrl(routineId);
  }

  async function copyRoutineLink(routineId: string) {
    if (typeof window === "undefined") {
      return;
    }

    const url = `${window.location.origin}/training?routine=${encodeURIComponent(routineId)}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedRoutineId(routineId);
    } catch {
      setCopiedRoutineId(null);
    } finally {
      setMenuRoutineId(null);
    }
  }

  function removeRoutine(routineId: string) {
    deleteWorkoutRoutine(routineId);
    setMenuRoutineId(null);
    setSelectedRoutineId((current) => (current === routineId ? null : current));
    setMode("list");
    replaceTrainingUrl();
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

  function retryCatalogFetch() {
    setCatalogRequestKey((current) => current + 1);
  }

  function renderRoutineCard(routineId: string, title: string, subtitle: string) {
    const menuOpen = menuRoutineId === routineId;
    const copied = copiedRoutineId === routineId;

    return (
      <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-[#0b1017] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-[#0f1520]">
        <button type="button" onClick={() => openRoutineDetail(routineId)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-[1.35rem] font-semibold tracking-[-0.05em] text-white">{title}</p>
          <p className="mt-1.5 truncate text-sm text-[var(--muted)]">{subtitle}</p>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMenuRoutineId((current) => (current === routineId ? null : routineId));
            }}
            className="flex size-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[var(--muted)] transition hover:bg-white/[0.08] hover:text-white"
          >
            <MoreVertical className="size-4" />
          </button>

          {menuOpen ? (
            <div
              className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-48 rounded-[18px] border border-white/8 bg-[#0a0f16] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.34)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => openBuilder(routineId)}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-sm text-white transition hover:bg-white/6"
              >
                <PencilLine className="size-4 text-[var(--accent)]" />
                Editar rotina
              </button>
              <button
                type="button"
                onClick={() => void copyRoutineLink(routineId)}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-sm text-white transition hover:bg-white/6"
              >
                <Link2 className="size-4 text-[var(--sky)]" />
                {copied ? "Ligacao copiada" : "Copiar ligacao"}
              </button>
              <button
                type="button"
                onClick={() => removeRoutine(routineId)}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-sm text-[#ff8a8a] transition hover:bg-white/6"
              >
                <Trash2 className="size-4" />
                Excluir rotina
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,#0b1017_0%,#090c12_100%)] px-4 py-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:px-6 lg:px-7">
      {mode === "list" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.78fr)]">
          <div>
            <h1 className="text-[1.9rem] font-semibold tracking-[-0.06em]">Rotinas</h1>
            <button type="button" className="mt-7 inline-flex items-center gap-3 text-sm text-[var(--muted)]">
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
              className="flex w-full items-center justify-between rounded-[24px] border border-white/8 bg-[#0b1017] px-5 py-6 text-left shadow-[0_12px_30px_rgba(0,0,0,0.24)] transition hover:bg-[#0f1520]"
            >
              <div className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-[16px] bg-white/6">
                  <NotebookPen className="size-5 text-[var(--accent)]" />
                </div>
                <span className="text-[1.45rem] font-medium tracking-[-0.04em]">Nova rotina</span>
              </div>
              <ChevronRight className="size-5 text-[var(--muted)]" />
            </button>

            <div className="flex w-full items-center justify-between rounded-[24px] border border-white/8 bg-[#0b1017] px-5 py-6 text-left shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <div className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-[16px] bg-white/6">
                  <FolderPlus className="size-5 text-[var(--sky)]" />
                </div>
                <span className="text-[1.45rem] font-medium tracking-[-0.04em]">Nova pasta</span>
              </div>
              <ChevronRight className="size-5 text-[var(--muted)]" />
            </div>
          </div>
        </div>
      ) : null}

      {mode === "builder" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(340px,0.9fr)]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("list");
                  replaceTrainingUrl();
                }}
                className="inline-flex items-center gap-3 text-[1.55rem] font-semibold tracking-[-0.045em]"
              >
                <ArrowLeft className="size-5" />
                {editingRoutineId ? "Editar rotina" : "Criar rotina"}
              </button>
              <Button
                onClick={saveRoutine}
                className="h-11 rounded-[14px] bg-[var(--accent)] px-5 text-sm font-medium text-black hover:brightness-95"
                disabled={!routineTitle.trim() || selectedExercises.length === 0}
              >
                Guardar rotina
              </Button>
            </div>

            <div className="mt-6">
              <p className="text-[0.82rem] font-medium text-[var(--muted)]">Titulo da rotina</p>
              <input
                value={routineTitle}
                onChange={(event) => setRoutineTitle(event.target.value)}
                placeholder="Titulo da rotina de treino"
                className={`${darkFieldClasses()} mt-2.5 h-12 text-[0.95rem]`}
              />
            </div>

            <div className="mt-5 min-h-[400px] rounded-[28px] border border-white/8 bg-[#0b1017] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              {selectedExercises.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="grid size-14 place-items-center rounded-full bg-white/6 text-[var(--muted)]">
                    <NotebookPen className="size-7" />
                  </div>
                  <p className="mt-5 text-[1.05rem] font-semibold tracking-[-0.035em]">Nenhum exercicio</p>
                  <p className="mt-2 max-w-md text-[0.95rem] leading-7 text-[var(--muted)]">
                    Escolha os exercicios da biblioteca ao lado para montar sua rotina.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {selectedExercises.map((item) => {
                    const exercise = exerciseMap.get(item.exerciseId);
                    if (!exercise) {
                      return null;
                    }

                    return (
                      <div key={item.exerciseId} className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
                        <div className="flex items-start gap-4">
                          <img src={exercise.mediaUrl} alt={exercise.name} className="size-16 rounded-[18px] object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.98rem] font-semibold tracking-[-0.03em]">{exercise.name}</p>
                            <p className="mt-1 text-sm capitalize text-[var(--muted)]">{exercise.muscle}</p>
                          </div>
                          <button type="button" onClick={() => removeExerciseFromDraft(item.exerciseId)} className="mt-0.5 text-[#ff8a8a]">
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <input
                            value={String(item.sets)}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { sets: Number(event.target.value || 0) })}
                            placeholder="Series"
                            className={darkFieldClasses()}
                          />
                          <input
                            value={item.reps}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { reps: event.target.value })}
                            placeholder="Reps"
                            className={darkFieldClasses()}
                          />
                          <input
                            value={item.weight}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { weight: event.target.value })}
                            placeholder="Carga"
                            className={darkFieldClasses()}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-[#0b1017] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[1rem] font-semibold tracking-[-0.03em]">Resumo</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Exercicios</p>
                      <p className="mt-1.5 text-[1.85rem] leading-none">{selectedExercises.length}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Series</p>
                      <p className="mt-1.5 text-[1.85rem] leading-none">{selectedExercises.reduce((total, item) => total + item.sets, 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[16px] bg-white/6 px-3.5 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                  {sessionUser?.name ?? "Usuario"}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-[#0b1017] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[1rem] font-semibold tracking-[-0.03em]">Biblioteca</p>
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(true)}
                  className="inline-flex items-center gap-2 text-[0.95rem] text-[var(--accent)]"
                >
                  <CirclePlus className="size-4" />
                  Exercicio personalizado
                </button>
              </div>

              <select value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)} className={`${darkFieldClasses()} mt-4 pr-10`}>
                {allEquipments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select value={muscleFilter} onChange={(event) => setMuscleFilter(event.target.value)} className={`${darkFieldClasses()} mt-3 pr-10`}>
                {allMuscles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.035] px-4">
                <Search className="size-4 text-[var(--muted)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Procurar exercicios"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                <span>
                  {catalogStatus === "success" ? `${filteredExercises.length} exercicios disponiveis` : "biblioteca em preparo"}
                </span>
                {catalogStatus === "success" ? <span>873+ exercicios da base completa</span> : null}
              </div>

              {catalogStatus === "loading" || catalogStatus === "idle" ? (
                <div className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.025] px-4 py-5 text-sm text-[var(--muted)]">
                  Carregando a biblioteca completa de exercicios para liberar os filtros.
                </div>
              ) : null}

              {catalogStatus === "error" ? (
                <div className="mt-5 rounded-[18px] border border-[rgba(255,157,92,0.24)] bg-[rgba(255,157,92,0.08)] px-4 py-4 text-sm text-white/84">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--warn)]" />
                    <div className="min-w-0">
                      <p className="font-medium text-white">Nao consegui carregar os 800+ exercicios agora.</p>
                      <p className="mt-1 text-white/70">{catalogError}</p>
                      <Button variant="secondary" onClick={retryCatalogFetch} className="mt-3 gap-2 rounded-[12px]">
                        <RefreshCw className="size-4" />
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {catalogStatus === "success" ? (
                <div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto pr-1">
                  {filteredExercises.length ? (
                    filteredExercises.map((exercise) => (
                      <div key={exercise.id} className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.025] px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => addLibraryExercise(exercise)}
                          className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-black transition hover:brightness-95"
                        >
                          <CirclePlus className="size-[0.95rem]" />
                        </button>
                        <img src={exercise.mediaUrl} alt={exercise.name} className="size-12 rounded-[14px] object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-[0.98rem] font-medium tracking-[-0.025em]">{exercise.name}</p>
                          <p className="text-[0.92rem] capitalize text-[var(--muted)]">{exercise.muscle}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.025] px-4 py-5 text-sm text-[var(--muted)]">
                      Nenhum exercicio encontrado com os filtros atuais. Ajuste musculo, equipamento ou busca.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "detail" && selectedRoutine ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.72fr)]">
          <div>
            <button
              type="button"
              onClick={() => {
                setMode("list");
                replaceTrainingUrl();
              }}
              className="inline-flex items-center gap-3 text-[1.8rem] font-semibold tracking-[-0.06em]"
            >
              <ArrowLeft className="size-6" />
              {selectedRoutine.title.toLowerCase()}
            </button>

            <div className="mt-6 rounded-[28px] border border-white/8 bg-[#0b1017] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <div className="grid gap-4 lg:grid-cols-2">
                {selectedRoutine.exercises.map((item) => {
                  const exercise = exerciseMap.get(item.exerciseId);
                  if (!exercise) {
                    return null;
                  }

                  return (
                    <div key={item.exerciseId} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-4">
                        <img src={exercise.mediaUrl} alt={exercise.name} className="size-16 rounded-[18px] object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold tracking-[-0.04em]">{exercise.name}</p>
                          <p className="mt-1 text-sm capitalize text-[var(--muted)]">{exercise.muscle}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Series</p>
                          <p className="mt-1 text-lg font-semibold">{item.sets}</p>
                        </div>
                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Reps</p>
                          <p className="mt-1 text-lg font-semibold">{item.reps}</p>
                        </div>
                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Carga</p>
                          <p className="mt-1 text-lg font-semibold">{item.weight}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/8 bg-[#0b1017] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <div className="flex items-center gap-4">
                {sessionUser?.avatarImage ? (
                  <img src={sessionUser.avatarImage} alt={sessionUser.name} className="size-14 rounded-[18px] object-cover" />
                ) : (
                  <div className="grid size-14 place-items-center rounded-[18px] bg-white/8 text-lg font-semibold text-white/80">
                    {sessionUser?.avatar ?? "PS"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Criada por</p>
                  <p className="truncate text-lg font-semibold tracking-[-0.04em]">
                    {sessionUser?.username?.replace(/^@/, "") ?? sessionUser?.name ?? "usuario"}
                  </p>
                </div>
              </div>
              <Button onClick={() => openBuilder(selectedRoutine.id)} className="mt-5 w-full rounded-[14px] bg-[var(--accent)] text-black hover:brightness-95">
                Editar rotina
              </Button>
              <Button variant="secondary" onClick={() => void copyRoutineLink(selectedRoutine.id)} className="mt-3 w-full rounded-[14px]">
                {copiedRoutineId === selectedRoutine.id ? "Ligacao copiada" : "Copiar ligacao da rotina"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => removeRoutine(selectedRoutine.id)}
                className="mt-3 w-full rounded-[14px] text-[#ff8a8a] hover:bg-white/6"
              >
                Excluir rotina
              </Button>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#0b1017] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <p className="text-lg font-semibold tracking-[-0.04em]">Resumo da rotina</p>

              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Exercicios</p>
                  <p className="mt-2 text-2xl">{selectedRoutine.exercises.length}</p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Series</p>
                  <p className="mt-2 text-2xl">{selectedRoutine.exercises.reduce((total, item) => total + item.sets, 0)}</p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Duracao</p>
                  <p className="mt-2 text-2xl">{selectedRoutine.durationMinutes} min</p>
                </div>
              </div>

              <div className="mt-5 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                {selectedRoutine.muscleGroups.slice(0, 4).map((muscle, index) => (
                  <div key={muscle} className="mt-4 first:mt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-white/84">{muscle}</span>
                      <span className="text-[var(--muted)]">{Math.max(1, selectedRoutine.exercises.length - index)}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-white/8">
                      <div
                        className="h-3 rounded-full bg-[var(--accent)]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xl">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b1017] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em]">Criar exercicio personalizado</h2>
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[var(--muted)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center border-t border-white/8 pt-6">
              <label className="grid size-32 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] text-[var(--muted)]">
                {customExercise.imageDataUrl ? (
                  <img src={customExercise.imageDataUrl} alt="Preview" className="size-32 rounded-full object-cover" />
                ) : (
                  <ImagePlus className="size-10" />
                )}
                <input type="file" accept="image/*" onChange={handleCustomImage} className="hidden" />
              </label>
              <label className="mt-4 inline-flex cursor-pointer rounded-[14px] border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white">
                Adicionar imagem
                <input type="file" accept="image/*" onChange={handleCustomImage} className="hidden" />
              </label>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-white/84">Nome do exercicio</p>
                <Input
                  value={customExercise.name}
                  onChange={(event) => setCustomExercise((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Introduz o nome do exercicio..."
                  className="h-12 rounded-[14px] border border-white/10 bg-white/[0.035]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-white/84">Tipo de exercicio</p>
                  <Input
                    value={customExercise.type}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, type: event.target.value }))}
                    placeholder="Ex: hipertrofia"
                    className="h-12 rounded-[14px] border border-white/10 bg-white/[0.035]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-white/84">Equipamento</p>
                  <Input
                    value={customExercise.equipment}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, equipment: event.target.value }))}
                    placeholder="Ex: halter"
                    className="h-12 rounded-[14px] border border-white/10 bg-white/[0.035]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-white/84">Grupo muscular primario</p>
                  <Input
                    value={customExercise.primaryMuscle}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, primaryMuscle: event.target.value }))}
                    placeholder="Ex: peito"
                    className="h-12 rounded-[14px] border border-white/10 bg-white/[0.035]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-white/84">Outros musculos</p>
                  <Input
                    value={customExercise.otherMuscles}
                    onChange={(event) => setCustomExercise((current) => ({ ...current, otherMuscles: event.target.value }))}
                    placeholder="Ex: triceps, ombro"
                    className="h-12 rounded-[14px] border border-white/10 bg-white/[0.035]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={createCustomExercise}
                className="rounded-[14px] bg-[var(--accent)] px-6 text-black hover:brightness-95"
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
