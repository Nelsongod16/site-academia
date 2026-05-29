"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  GripVertical,
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
import type { CustomRoutineConfig, Exercise, RoutineType, RunRoutineConfig, TrainingCalendarStatus, WorkoutExercise } from "@/types/app";

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

const emptyRunRoutine: RunRoutineConfig = {
  desiredTime: "",
  desiredDistance: "",
  desiredPace: "",
  actualTime: "",
  actualDistance: "",
  actualPace: "",
};

const emptyCustomRoutine: CustomRoutineConfig = {
  duration: "",
  focus: "",
  note: "",
};

function toTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createEmptySetRow() {
  return {
    weight: "",
    reps: "",
  };
}

function ensureSetRows(exercise: WorkoutExercise) {
  const count = Math.max(1, exercise.sets || 1);

  if (exercise.setRows?.length) {
    const nextRows = exercise.setRows.slice(0, count);

    while (nextRows.length < count) {
      nextRows.push(createEmptySetRow());
    }

    return nextRows;
  }

  return Array.from({ length: count }, () => ({
    weight: exercise.weight ?? "",
    reps: exercise.reps ?? "",
  }));
}

function summarizeSetRows(setRows: Array<{ weight: string; reps: string }>) {
  const weights = Array.from(new Set(setRows.map((row) => row.weight.trim()).filter(Boolean)));
  const reps = Array.from(new Set(setRows.map((row) => row.reps.trim()).filter(Boolean)));

  return {
    sets: Math.max(1, setRows.length),
    weight: weights.length <= 1 ? (weights[0] ?? "") : "variado",
    reps: reps.length <= 1 ? (reps[0] ?? "") : "variado",
  };
}

function normalizeWorkoutExercise(exercise: WorkoutExercise): WorkoutExercise {
  const setRows = ensureSetRows(exercise);
  const summary = summarizeSetRows(setRows);

  return {
    ...exercise,
    ...summary,
    setRows,
    note: exercise.note ?? "",
    restTimer: exercise.restTimer ?? "Desligado",
  };
}

function initialExercise(exerciseId: string): WorkoutExercise {
  return {
    exerciseId,
    sets: 3,
    reps: "",
    weight: "",
    note: "",
    restTimer: "Desligado",
    setRows: [createEmptySetRow(), createEmptySetRow(), createEmptySetRow()],
  };
}

function darkFieldClasses() {
  return "h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40 [color-scheme:dark]";
}

function parseDurationToMinutes(value: string) {
  const clean = value.trim();

  if (!clean) {
    return 0;
  }

  if (/^\d+$/.test(clean)) {
    return Number(clean);
  }

  const parts = clean.split(":").map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 2) {
    return parts[0] + Math.round(parts[1] / 60);
  }

  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
  }

  return 0;
}

function normalizeRunRoutine(config?: Partial<RunRoutineConfig> | null): RunRoutineConfig {
  return {
    desiredTime: config?.desiredTime ?? config?.time ?? "",
    desiredDistance: config?.desiredDistance ?? config?.distance ?? config?.kms ?? "",
    desiredPace: config?.desiredPace ?? config?.pace ?? "",
    actualTime: config?.actualTime ?? "",
    actualDistance: config?.actualDistance ?? "",
    actualPace: config?.actualPace ?? "",
  };
}

function runRoutineHasValues(config: RunRoutineConfig) {
  return [
    config.desiredTime,
    config.desiredDistance,
    config.desiredPace,
    config.actualTime,
    config.actualDistance,
    config.actualPace,
  ].some((value) => value.trim());
}

function buildRunRoutineQuickNote(config: RunRoutineConfig) {
  const desired = [config.desiredTime, config.desiredDistance, config.desiredPace].filter((value) => value.trim()).join(" | ");
  const actual = [config.actualTime, config.actualDistance, config.actualPace].filter((value) => value.trim()).join(" | ");

  if (desired && actual) {
    return `Desejado: ${desired} | Real: ${actual}`;
  }

  if (desired) {
    return `Desejado: ${desired}`;
  }

  if (actual) {
    return `Real: ${actual}`;
  }

  return "Rotina de corrida personalizada.";
}

function routineTypeLabel(type: RoutineType) {
  switch (type) {
    case "run":
      return "Rotina de corrida";
    case "custom":
      return "Personalizado";
    default:
      return "Rotina de treino";
  }
}

const miniCalendarWeekdays = ["S", "T", "Q", "Q", "S", "S", "D"];

function toCalendarDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toCalendarMonthKey(date: Date) {
  return toCalendarDateKey(date).slice(0, 7);
}

function buildMiniCalendarDays(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const days: Array<Date | null> = Array.from({ length: leadingEmptyDays }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function cycleTrainingCalendarStatus(status?: TrainingCalendarStatus) {
  if (status === "gym") {
    return "rest" as const;
  }

  if (status === "rest") {
    return null;
  }

  return "gym" as const;
}

export function TrainingScreen() {
  const searchParams = useSearchParams();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const exercises = useStore(useAppStore, (state) => state.exercises);
  const trainingCalendarEntries = useStore(useAppStore, (state) => state.trainingCalendarEntries);
  const saveWorkoutRoutine = useStore(useAppStore, (state) => state.saveWorkoutRoutine);
  const deleteWorkoutRoutine = useStore(useAppStore, (state) => state.deleteWorkoutRoutine);
  const setTrainingCalendarEntry = useStore(useAppStore, (state) => state.setTrainingCalendarEntry);
  const upsertExercises = useStore(useAppStore, (state) => state.upsertExercises);

  const routineWorkouts = useMemo(
    () => workouts.filter((workout) => workout.kind === "gym" || workout.routineType === "run" || workout.routineType === "custom"),
    [workouts],
  );

  const [mode, setMode] = useState<ScreenMode>("list");
  const [builderRoutineType, setBuilderRoutineType] = useState<RoutineType>("strength");
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(routineWorkouts[0]?.id ?? null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineTitle, setRoutineTitle] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [runRoutine, setRunRoutine] = useState<RunRoutineConfig>(emptyRunRoutine);
  const [customRoutine, setCustomRoutine] = useState<CustomRoutineConfig>(emptyCustomRoutine);
  const [equipmentFilter, setEquipmentFilter] = useState("Todos os equipamentos");
  const [muscleFilter, setMuscleFilter] = useState("Todos os musculos");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [routineTypePickerOpen, setRoutineTypePickerOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customExercise, setCustomExercise] = useState<CustomExerciseForm>(emptyCustomExercise);
  const [menuRoutineId, setMenuRoutineId] = useState<string | null>(null);
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);
  const [catalogExercises, setCatalogExercises] = useState<Exercise[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [catalogError, setCatalogError] = useState("");
  const [catalogRequestKey, setCatalogRequestKey] = useState(0);
  const [calendarReferenceDate] = useState(() => new Date());

  const calendarDays = useMemo(() => buildMiniCalendarDays(calendarReferenceDate), [calendarReferenceDate]);
  const currentMonthKey = useMemo(() => toCalendarMonthKey(calendarReferenceDate), [calendarReferenceDate]);
  const calendarLabel = useMemo(
    () => calendarReferenceDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    [calendarReferenceDate],
  );
  const todayKey = useMemo(() => toCalendarDateKey(new Date()), []);
  const currentMonthCalendarSummary = useMemo(() => {
    return Object.entries(trainingCalendarEntries).reduce(
      (summary, [date, status]) => {
        if (!date.startsWith(currentMonthKey)) {
          return summary;
        }

        if (status === "gym") {
          summary.gym += 1;
        }

        if (status === "rest") {
          summary.rest += 1;
        }

        return summary;
      },
      { gym: 0, rest: 0 },
    );
  }, [currentMonthKey, trainingCalendarEntries]);

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

  const selectedRoutineType = useMemo(() => {
    if (!selectedRoutine) {
      return "strength" as RoutineType;
    }

    if (selectedRoutine.routineType) {
      return selectedRoutine.routineType;
    }

    if (selectedRoutine.kind === "run") {
      return "run";
    }

    if (selectedRoutine.kind === "rest") {
      return "custom";
    }

    return "strength";
  }, [selectedRoutine]);

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
    if (mode !== "builder" || builderRoutineType !== "strength") {
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
  }, [builderRoutineType, catalogExercises.length, catalogRequestKey, mode]);

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

  function openBuilder(type: RoutineType, routineId?: string) {
    if (routineId) {
      const routine = routineWorkouts.find((item) => item.id === routineId);

      if (routine) {
        setEditingRoutineId(routine.id);
        setRoutineTitle(routine.title);
        setSelectedExercises(routine.exercises.map(normalizeWorkoutExercise));
        setBuilderRoutineType(type);
        setRunRoutine(normalizeRunRoutine(routine.runConfig));
        setCustomRoutine(
          routine.customConfig ?? {
            duration: routine.durationMinutes ? String(routine.durationMinutes) : "",
            focus: routine.muscleGroups.join(", "),
            note: routine.quickNote ?? "",
          },
        );
      }
    } else {
      setEditingRoutineId(null);
      setRoutineTitle("");
      setSelectedExercises([]);
      setBuilderRoutineType(type);
      setRunRoutine(emptyRunRoutine);
      setCustomRoutine(emptyCustomRoutine);
    }

    setRoutineTypePickerOpen(false);
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

  function syncDraftSetRows(exerciseId: string, setRows: Array<{ weight: string; reps: string }>) {
    const summary = summarizeSetRows(setRows);

    updateDraftExercise(exerciseId, {
      ...summary,
      setRows,
    });
  }

  function updateDraftSetRow(exerciseId: string, rowIndex: number, patch: Partial<{ weight: string; reps: string }>) {
    const exercise = selectedExercises.find((item) => item.exerciseId === exerciseId);
    if (!exercise) {
      return;
    }

    const setRows = ensureSetRows(exercise).map((row, index) => (index === rowIndex ? { ...row, ...patch } : row));
    syncDraftSetRows(exerciseId, setRows);
  }

  function addDraftSetRow(exerciseId: string) {
    const exercise = selectedExercises.find((item) => item.exerciseId === exerciseId);
    if (!exercise) {
      return;
    }

    syncDraftSetRows(exerciseId, [...ensureSetRows(exercise), createEmptySetRow()]);
  }

  function removeDraftSetRow(exerciseId: string, rowIndex: number) {
    const exercise = selectedExercises.find((item) => item.exerciseId === exerciseId);
    if (!exercise) {
      return;
    }

    const currentRows = ensureSetRows(exercise);
    if (currentRows.length <= 1) {
      return;
    }

    syncDraftSetRows(
      exerciseId,
      currentRows.filter((_, index) => index !== rowIndex),
    );
  }

  function saveRoutine() {
    const cleanTitle = toTitle(routineTitle);

    if (!cleanTitle) {
      return;
    }

    let routineId = "";

    if (builderRoutineType === "strength") {
      if (selectedExercises.length === 0) {
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

      routineId = saveWorkoutRoutine({
        id: editingRoutineId ?? undefined,
        title: cleanTitle,
        durationMinutes: Math.max(20, selectedExercises.length * 12),
        muscleGroups,
        exercises: selectedExercises.map(normalizeWorkoutExercise),
        kind: "gym",
        routineType: "strength",
      });
    } else if (builderRoutineType === "run") {
      const durationMinutes = parseDurationToMinutes(runRoutine.desiredTime || runRoutine.actualTime) || 30;

      routineId = saveWorkoutRoutine({
        id: editingRoutineId ?? undefined,
        title: cleanTitle,
        durationMinutes,
        muscleGroups: ["cardio", "corrida"],
        exercises: [],
        kind: "run",
        routineType: "run",
        quickNote: buildRunRoutineQuickNote(runRoutine),
        runConfig: runRoutine,
      });
    } else {
      const durationMinutes = parseDurationToMinutes(customRoutine.duration) || 30;
      const muscleGroups = customRoutine.focus
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      routineId = saveWorkoutRoutine({
        id: editingRoutineId ?? undefined,
        title: cleanTitle,
        durationMinutes,
        muscleGroups: muscleGroups.length ? muscleGroups : ["personalizado"],
        exercises: [],
        kind: "rest",
        routineType: "custom",
        quickNote: customRoutine.note || "Rotina personalizada criada pelo usuario.",
        customConfig: customRoutine,
      });
    }

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

  function buildRoutineSubtitle(routineId: string) {
    const routine = routineWorkouts.find((item) => item.id === routineId);

    if (!routine) {
      return "";
    }

    const routineType = routine.routineType ?? (routine.kind === "run" ? "run" : routine.kind === "rest" ? "custom" : "strength");

    if (routineType === "run") {
      const runConfig = normalizeRunRoutine(routine.runConfig);

      return [
        runConfig.desiredTime && `desejado ${runConfig.desiredTime}`,
        runConfig.desiredDistance && runConfig.desiredDistance,
        runConfig.desiredPace && `pace ${runConfig.desiredPace}`,
        runConfig.actualTime && `real ${runConfig.actualTime}`,
      ]
        .filter(Boolean)
        .join(" | ");
    }

    if (false) {
      return [
        routine?.runConfig?.time && `tempo ${routine?.runConfig?.time}`,
        routine?.runConfig?.kms && `${routine?.runConfig?.kms} km`,
        routine?.runConfig?.pace && `pace ${routine?.runConfig?.pace}`,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    if (routineType === "custom") {
      return routine.customConfig?.focus || routine.quickNote || "Rotina livre personalizada.";
    }

    return routine.exercises
      .map((item) => exerciseMap.get(item.exerciseId)?.name ?? "Exercicio")
      .slice(0, 3)
      .join(", ");
  }

  function renderRoutineCard(routineId: string, title: string, subtitle: string) {
    const menuOpen = menuRoutineId === routineId;
    const copied = copiedRoutineId === routineId;
    const routine = routineWorkouts.find((item) => item.id === routineId);
    const type = routine?.routineType ?? (routine?.kind === "run" ? "run" : routine?.kind === "rest" ? "custom" : "strength");

    return (
      <div className="flex items-center gap-3 rounded-[24px] bg-[#0b1017] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-[#0f1520]">
        <button type="button" onClick={() => openRoutineDetail(routineId)} className="min-w-0 flex-1 text-left">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">{routineTypeLabel(type)}</p>
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
                onClick={() => openBuilder(type, routineId)}
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
    <section className="rounded-[34px] bg-[linear-gradient(180deg,#0b1017_0%,#090c12_100%)] px-4 py-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:px-6 lg:px-7">
      {mode === "list" ? (
        <>
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
                    buildRoutineSubtitle(routine.id),
                  ),
                )}
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setRoutineTypePickerOpen(true)}
                className="flex w-full items-center justify-between rounded-[24px] bg-[#0b1017] px-5 py-6 text-left shadow-[0_12px_30px_rgba(0,0,0,0.24)] transition hover:bg-[#0f1520]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-[16px] bg-white/6">
                    <NotebookPen className="size-5 text-[var(--accent)]" />
                  </div>
                  <span className="text-[1.45rem] font-medium tracking-[-0.04em]">Adicionar rotina</span>
                </div>
                <ChevronRight className="size-5 text-[var(--muted)]" />
              </button>
            </div>
          </div>
          <div className="mt-6 max-w-[23rem] rounded-[24px] border border-white/8 bg-[#0b1017] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">Calendario</p>
                <h2 className="mt-1 text-[1rem] font-semibold tracking-[-0.04em]">Treino e descanso</h2>
              </div>
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[0.68rem] capitalize text-[var(--muted)]">
                {calendarLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {miniCalendarWeekdays.map((label, index) => (
                <span key={`${label}-${index}`} className="text-center text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  {label}
                </span>
              ))}
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-8 rounded-[10px] bg-transparent" aria-hidden="true" />;
                }

                const dayKey = toCalendarDateKey(day);
                const status = trainingCalendarEntries[dayKey];
                const isToday = dayKey === todayKey;
                const nextStatus = cycleTrainingCalendarStatus(status);

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setTrainingCalendarEntry(dayKey, nextStatus)}
                    className={[
                      "flex h-8 items-center justify-center rounded-[10px] border text-[0.72rem] font-medium transition",
                      status === "gym"
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/18 text-[var(--accent)]"
                        : status === "rest"
                          ? "border-[#c9a7ff]/30 bg-[#c9a7ff]/16 text-[#d8c0ff]"
                          : "border-white/8 bg-white/[0.03] text-white/82 hover:bg-white/[0.06]",
                      isToday ? "ring-1 ring-white/18" : "",
                    ].join(" ")}
                    aria-label={`Dia ${day.getDate()} marcado como ${status === "gym" ? "academia" : status === "rest" ? "descanso" : "livre"}.`}
                    title={`Dia ${day.getDate()} - ${status === "gym" ? "academia" : status === "rest" ? "descanso" : "livre"}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-[0.68rem] text-[var(--muted)]">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--accent)]" />
                Academia
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#c9a7ff]" />
                Descanso
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2 text-[0.72rem] text-[var(--muted)]">
              <span>{currentMonthCalendarSummary.gym} treinos</span>
              <span>{currentMonthCalendarSummary.rest} descansos</span>
            </div>
          </div>
        </>
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
                {editingRoutineId ? `Editar ${routineTypeLabel(builderRoutineType).toLowerCase()}` : routineTypeLabel(builderRoutineType)}
              </button>
              <Button
                onClick={saveRoutine}
                className="h-11 rounded-[14px] bg-[var(--accent)] px-5 text-sm font-medium text-black hover:brightness-95"
                disabled={
                  !routineTitle.trim() ||
                  (builderRoutineType === "strength" && selectedExercises.length === 0) ||
                  (builderRoutineType === "run" && !runRoutineHasValues(runRoutine))
                }
              >
                Guardar rotina
              </Button>
            </div>

            <div className="mt-6">
              <p className="text-[0.82rem] font-medium text-[var(--muted)]">Titulo da rotina</p>
              <input
                value={routineTitle}
                onChange={(event) => setRoutineTitle(event.target.value)}
                placeholder={
                  builderRoutineType === "run"
                    ? "Ex: Corrida progressiva de quinta"
                    : builderRoutineType === "custom"
                      ? "Ex: Rotina livre de mobilidade"
                      : "Titulo da rotina de treino"
                }
                className={`${darkFieldClasses()} mt-2.5 h-12 text-[0.95rem]`}
              />
            </div>

            <div className="mt-5 min-h-[400px] rounded-[28px] border border-white/8 bg-[#0b1017] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              {builderRoutineType === "strength" && selectedExercises.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="grid size-14 place-items-center rounded-full bg-white/6 text-[var(--muted)]">
                    <NotebookPen className="size-7" />
                  </div>
                  <p className="mt-5 text-[1.05rem] font-semibold tracking-[-0.035em]">Nenhum exercicio</p>
                  <p className="mt-2 max-w-md text-[0.95rem] leading-7 text-[var(--muted)]">
                    Escolha os exercicios da biblioteca ao lado para montar sua rotina.
                  </p>
                </div>
              ) : builderRoutineType === "strength" ? (
                <div className="space-y-5">
                  {selectedExercises.map((item) => {
                    const exercise = exerciseMap.get(item.exerciseId);
                    if (!exercise) {
                      return null;
                    }

                    const setRows = ensureSetRows(item);

                    return (
                      <div key={item.exerciseId} className="rounded-[22px] border border-white/8 bg-white/[0.02] p-5">
                        <div className="flex items-start gap-3">
                          <button type="button" className="mt-1 text-[var(--muted)]" aria-label="Reordenar exercicio">
                            <GripVertical className="size-4" />
                          </button>
                          <img src={exercise.mediaUrl} alt={exercise.name} className="size-14 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[1.02rem] font-semibold tracking-[-0.03em]">{exercise.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExerciseFromDraft(item.exerciseId)}
                            className="mt-0.5 text-[var(--muted)] transition hover:text-white"
                            aria-label="Remover exercicio"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </div>

                        <div className="mt-5">
                          <p className="text-[0.78rem] font-medium text-white/84">Nota</p>
                          <textarea
                            value={item.note ?? ""}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { note: event.target.value })}
                            placeholder="Adicionar nota afixada"
                            rows={2}
                            className="mt-2 w-full rounded-[14px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40"
                          />
                        </div>

                        <div className="mt-4">
                          <p className="text-[0.78rem] font-medium text-white/84">Temporizador de descanso</p>
                          <select
                            value={item.restTimer ?? "Desligado"}
                            onChange={(event) => updateDraftExercise(item.exerciseId, { restTimer: event.target.value })}
                            className={`${darkFieldClasses()} mt-2 max-w-[220px] pr-10`}
                          >
                            {["Desligado", "30s", "45s", "60s", "90s", "120s"].map((option) => (
                              <option key={option} value={option} className="bg-[#0f141c] text-white">
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-5 grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)_32px] gap-3">
                          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">Serie</p>
                          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">Kg</p>
                          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">Reps</p>
                          <div />

                          {setRows.map((row, rowIndex) => (
                            <div
                              key={`${item.exerciseId}-${rowIndex}`}
                              className="col-span-4 grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-3 rounded-[14px] bg-white/[0.035] px-3 py-2"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-[#0b1017] text-base font-medium text-white">
                                {rowIndex + 1}
                              </div>
                              <input
                                value={row.weight}
                                onChange={(event) => updateDraftSetRow(item.exerciseId, rowIndex, { weight: event.target.value })}
                                className={`${darkFieldClasses()} h-11 bg-[#0b1017] text-[0.95rem]`}
                              />
                              <input
                                value={row.reps}
                                onChange={(event) => updateDraftSetRow(item.exerciseId, rowIndex, { reps: event.target.value })}
                                className={`${darkFieldClasses()} h-11 bg-[#0b1017] text-[0.95rem]`}
                              />
                              <button
                                type="button"
                                onClick={() => removeDraftSetRow(item.exerciseId, rowIndex)}
                                className="text-lg text-[var(--muted)] transition hover:text-white"
                                aria-label={`Remover serie ${rowIndex + 1}`}
                              >
                                x
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => addDraftSetRow(item.exerciseId)}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-white/8 bg-white/[0.035] text-[0.98rem] font-medium text-white transition hover:bg-white/[0.06]"
                          >
                            <CirclePlus className="size-4" />
                            Adicionar serie
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : builderRoutineType === "run" ? (
                <div>
                  <p className="text-[1.02rem] font-semibold tracking-[-0.03em]">Detalhes da corrida</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    Defina os dados principais da rotina de corrida para salvar um bloco pronto e reutilizavel.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Tempo desejado</p>
                      <input
                        value={runRoutine.desiredTime}
                        onChange={(event) => setRunRoutine((current) => ({ ...current, desiredTime: event.target.value }))}
                        placeholder="Ex: 45:00"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Pace desejado</p>
                      <input
                        value={runRoutine.desiredPace}
                        onChange={(event) => setRunRoutine((current) => ({ ...current, desiredPace: event.target.value }))}
                        placeholder="Ex: 5:20/km"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Distancia desejada</p>
                      <input
                        value={runRoutine.desiredDistance}
                        onChange={(event) => setRunRoutine((current) => ({ ...current, desiredDistance: event.target.value }))}
                        placeholder="Ex: 8000 m"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Tempo real</p>
                      <input
                        value={runRoutine.actualTime}
                        onChange={(event) => setRunRoutine((current) => ({ ...current, actualTime: event.target.value }))}
                        placeholder="Ex: 47:30"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Pace real</p>
                      <input
                        value={runRoutine.actualPace}
                        onChange={(event) => setRunRoutine((current) => ({ ...current, actualPace: event.target.value }))}
                        placeholder="Ex: 5:56/km"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Distancia real</p>
                      <input
                        value={runRoutine.actualDistance}
                        onChange={(event) => setRunRoutine((current) => ({ ...current, actualDistance: event.target.value }))}
                        placeholder="Ex: 7900 m"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[1.02rem] font-semibold tracking-[-0.03em]">Bloco personalizado</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    Use este formato para rotinas livres, mobilidade, recuperacao ou protocolos que nao dependem da biblioteca de exercicios.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Duracao</p>
                      <input
                        value={customRoutine.duration}
                        onChange={(event) => setCustomRoutine((current) => ({ ...current, duration: event.target.value }))}
                        placeholder="Ex: 30"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                    <div>
                      <p className="text-[0.82rem] font-medium text-[var(--muted)]">Foco</p>
                      <input
                        value={customRoutine.focus}
                        onChange={(event) => setCustomRoutine((current) => ({ ...current, focus: event.target.value }))}
                        placeholder="Ex: mobilidade, core"
                        className={`${darkFieldClasses()} mt-2.5`}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[0.82rem] font-medium text-[var(--muted)]">Observacoes</p>
                    <textarea
                      value={customRoutine.note}
                      onChange={(event) => setCustomRoutine((current) => ({ ...current, note: event.target.value }))}
                      placeholder="Descreva o que precisa acontecer nessa rotina."
                      rows={6}
                      className="mt-2.5 w-full rounded-[16px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40"
                    />
                  </div>
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
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        {builderRoutineType === "strength" ? "Exercicios" : builderRoutineType === "run" ? "Desejado" : "Duracao"}
                      </p>
                      {builderRoutineType === "run" ? (
                        <div className="mt-2 space-y-1.5 text-[0.94rem] leading-5">
                          <p>{runRoutine.desiredTime || "--"}</p>
                          <p>{runRoutine.desiredPace || "--"}</p>
                          <p>{runRoutine.desiredDistance || "--"}</p>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[1.85rem] leading-none">
                          {builderRoutineType === "strength" ? selectedExercises.length : customRoutine.duration || "--"}
                        </p>
                      )}
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        {builderRoutineType === "strength" ? "Series" : builderRoutineType === "run" ? "Real" : "Foco"}
                      </p>
                      {builderRoutineType === "run" ? (
                        <div className="mt-2 space-y-1.5 text-[0.94rem] leading-5">
                          <p>{runRoutine.actualTime || "--"}</p>
                          <p>{runRoutine.actualPace || "--"}</p>
                          <p>{runRoutine.actualDistance || "--"}</p>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[1.2rem] leading-none">
                          {builderRoutineType === "strength"
                            ? selectedExercises.reduce((total, item) => total + item.sets, 0)
                            : customRoutine.focus || "--"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-[16px] bg-white/6 px-3.5 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                  {sessionUser?.name ?? "Usuario"}
                </div>
              </div>
            </div>

            {builderRoutineType === "strength" ? (
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
                  <option key={item} value={item} className="bg-[#0f141c] text-white">
                    {item}
                  </option>
                ))}
              </select>
              <select value={muscleFilter} onChange={(event) => setMuscleFilter(event.target.value)} className={`${darkFieldClasses()} mt-3 pr-10`}>
                {allMuscles.map((item) => (
                  <option key={item} value={item} className="bg-[#0f141c] text-white">
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
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-[#0b1017] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
                <p className="text-[1rem] font-semibold tracking-[-0.03em]">
                  {builderRoutineType === "run" ? "Preview da corrida" : "Preview do bloco"}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {builderRoutineType === "run"
                    ? "Salve um molde de corrida com os numeros principais para reutilizar quando quiser."
                    : "Salve um bloco livre com observacoes, foco e duracao para encaixar na semana."}
                </p>

                <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                  {builderRoutineType === "run" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] bg-black/20 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Desejado</p>
                        <div className="mt-2 space-y-1.5">
                          <p className="text-lg font-semibold">{runRoutine.desiredTime || "--"}</p>
                          <p className="text-sm text-white/72">{runRoutine.desiredPace || "--"}</p>
                          <p className="text-sm text-white/72">{runRoutine.desiredDistance || "--"}</p>
                        </div>
                      </div>
                      <div className="rounded-[16px] bg-black/20 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Real</p>
                        <div className="mt-2 space-y-1.5">
                          <p className="text-lg font-semibold">{runRoutine.actualTime || "--"}</p>
                          <p className="text-sm text-white/72">{runRoutine.actualPace || "--"}</p>
                          <p className="text-sm text-white/72">{runRoutine.actualDistance || "--"}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Observacoes</p>
                      <p className="mt-2 text-sm leading-7 text-white/84">{customRoutine.note || "Nenhuma observacao definida ainda."}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              {selectedRoutineType === "strength" ? (
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
              ) : selectedRoutineType === "run" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Tempo desejado", normalizeRunRoutine(selectedRoutine.runConfig).desiredTime || "--"],
                    ["Pace desejado", normalizeRunRoutine(selectedRoutine.runConfig).desiredPace || "--"],
                    ["Distancia desejada", normalizeRunRoutine(selectedRoutine.runConfig).desiredDistance || "--"],
                    ["Tempo real", normalizeRunRoutine(selectedRoutine.runConfig).actualTime || "--"],
                    ["Pace real", normalizeRunRoutine(selectedRoutine.runConfig).actualPace || "--"],
                    ["Distancia real", normalizeRunRoutine(selectedRoutine.runConfig).actualDistance || "--"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
                      <p className="mt-3 text-[1.4rem] font-semibold tracking-[-0.04em] text-white">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Observacoes</p>
                  <p className="mt-3 text-sm leading-7 text-white/84">
                    {selectedRoutine.customConfig?.note || selectedRoutine.quickNote || "Rotina personalizada sem observacoes adicionais."}
                  </p>
                </div>
              )}
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
              <Button
                onClick={() => openBuilder(selectedRoutineType, selectedRoutine.id)}
                className="mt-5 w-full rounded-[14px] bg-[var(--accent)] text-black hover:brightness-95"
              >
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
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    {selectedRoutineType === "strength" ? "Exercicios" : selectedRoutineType === "run" ? "Distancia desejada" : "Foco"}
                  </p>
                  <p className="mt-2 text-2xl">
                    {selectedRoutineType === "strength"
                      ? selectedRoutine.exercises.length
                      : selectedRoutineType === "run"
                        ? normalizeRunRoutine(selectedRoutine.runConfig).desiredDistance || "--"
                        : selectedRoutine.customConfig?.focus || "--"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    {selectedRoutineType === "strength" ? "Series" : selectedRoutineType === "run" ? "Pace desejado" : "Tipo"}
                  </p>
                  <p className="mt-2 text-2xl">
                    {selectedRoutineType === "strength"
                      ? selectedRoutine.exercises.reduce((total, item) => total + item.sets, 0)
                      : selectedRoutineType === "run"
                        ? normalizeRunRoutine(selectedRoutine.runConfig).desiredPace || "--"
                        : "Livre"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Duracao</p>
                  <p className="mt-2 text-2xl">{selectedRoutine.durationMinutes} min</p>
                </div>
              </div>

              {selectedRoutine.muscleGroups.length ? (
                <div className="mt-5 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                  {selectedRoutine.muscleGroups.slice(0, 4).map((muscle, index) => (
                    <div key={muscle} className="mt-4 first:mt-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-white/84">{muscle}</span>
                        <span className="text-[var(--muted)]">
                          {selectedRoutineType === "strength" ? Math.max(1, selectedRoutine.exercises.length - index) : index === 0 ? "foco" : "extra"}
                        </span>
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
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {routineTypePickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xl">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#0b1017] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">novo bloco</p>
                <h2 className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em]">Escolha o tipo de rotina</h2>
              </div>
              <button
                type="button"
                onClick={() => setRoutineTypePickerOpen(false)}
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[var(--muted)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  type: "strength" as RoutineType,
                  title: "Rotina de treino",
                  body: "Monte um bloco com exercicios, series, reps, carga e descanso.",
                },
                {
                  type: "run" as RoutineType,
                  title: "Rotina de corrida",
                  body: "Salve tempo, kms, distancia e pace para repetir a sessao depois.",
                },
                {
                  type: "custom" as RoutineType,
                  title: "Personalizado",
                  body: "Crie um bloco livre para mobilidade, recovery, core ou protocolos proprios.",
                },
              ].map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => openBuilder(option.type)}
                  className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-left transition hover:border-[var(--accent)]/35 hover:bg-white/[0.05]"
                >
                  <p className="text-[1.1rem] font-semibold tracking-[-0.03em] text-white">{option.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{option.body}</p>
                </button>
              ))}
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
