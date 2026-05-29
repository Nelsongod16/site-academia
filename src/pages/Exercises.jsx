"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronRight, Dumbbell, RefreshCw, Search, Sparkles, Target, X } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useStore } from "zustand";

import { ExerciseCard } from "@/components/ExerciseCard";
import { PageFrame } from "@/components/layout/page-frame";
import { MuscleFilter } from "@/components/MuscleFilter";
import { Button, Input, SectionHeading, SkeletonBlock, StrongSurface, Surface } from "@/components/ui/kit";
import { cn } from "@/lib/utils";
import {
  BODY_PART_OPTIONS,
  EXERCISE_PAGE_SIZE,
  TARGET_FILTER_OPTIONS,
  fetchExercisesByBodyPart,
  getBodyPartLabel,
  getTargetLabel,
} from "@/services/exerciseService";
import { useAppStore } from "@/store/app-store";

function ExerciseSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/7 bg-white/[0.03]">
      <SkeletonBlock className="h-56 w-full rounded-none" />
      <div className="space-y-4 p-5">
        <SkeletonBlock className="h-6 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <div className="space-y-2 rounded-[18px] border border-white/6 p-4">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-11/12" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
        <SkeletonBlock className="h-11 w-full" />
      </div>
    </div>
  );
}

export default function Exercises() {
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const quickWorkoutId = useStore(useAppStore, (state) => state.quickWorkoutId);
  const addExercisesToWorkout = useStore(useAppStore, (state) => state.addExercisesToWorkout);
  const upsertExercises = useStore(useAppStore, (state) => state.upsertExercises);

  const selectedWorkout = workouts.find((workout) => workout.id === quickWorkoutId) ?? workouts[0] ?? null;
  const selectedWorkoutExerciseIds = useMemo(
    () => new Set(selectedWorkout?.exercises.map((exercise) => exercise.exerciseId) ?? []),
    [selectedWorkout],
  );

  const [selectedBodyPart, setSelectedBodyPart] = useState("chest");
  const [selectedTarget, setSelectedTarget] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(EXERCISE_PAGE_SIZE);
  const [requestKey, setRequestKey] = useState(0);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [exercises, setExercises] = useState([]);
  const [activeExerciseId, setActiveExerciseId] = useState(null);

  const deferredSearch = useDeferredValue(search);
  const activeBodyPartMeta = BODY_PART_OPTIONS.find((option) => option.value === selectedBodyPart) ?? BODY_PART_OPTIONS[0];

  useEffect(() => {
    const controller = new AbortController();

    fetchExercisesByBodyPart(selectedBodyPart, { signal: controller.signal })
      .then((items) => {
        const nextExercises = items.map((exercise) => ({
          ...exercise,
          bodyPartLabel: getBodyPartLabel(exercise.bodyPart),
          targetLabel: getTargetLabel(exercise.target || exercise.bodyPart),
        }));

        setActiveExerciseId(null);
        setExercises(nextExercises);
        setStatus("success");
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setExercises([]);
        setStatus("error");
        setErrorMessage(error?.response?.data?.message ?? "Nao foi possivel carregar os exercicios agora.");
      });

    return () => controller.abort();
  }, [requestKey, selectedBodyPart]);

  const targetCounts = useMemo(() => {
    return exercises.reduce(
      (accumulator, exercise) => {
        if (exercise.target) {
          accumulator[exercise.target] = (accumulator[exercise.target] ?? 0) + 1;
        }
        return accumulator;
      },
      { all: exercises.length },
    );
  }, [exercises]);

  const targetOptions = useMemo(() => {
    const availableTargets = new Set(exercises.map((exercise) => exercise.target).filter(Boolean));

    return TARGET_FILTER_OPTIONS.filter((option) => option.value === "all" || availableTargets.has(option.value));
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (selectedTarget !== "all" && exercise.target !== selectedTarget) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [exercise.name, exercise.targetLabel, exercise.equipment, exercise.bodyPartLabel]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [deferredSearch, exercises, selectedTarget]);

  const visibleExercises = filteredExercises.slice(0, visibleCount);
  const hasMore = visibleCount < filteredExercises.length;
  const activeExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === activeExerciseId) ?? null,
    [activeExerciseId, exercises],
  );

  function handleBodyPartChange(nextBodyPart) {
    if (nextBodyPart === selectedBodyPart) {
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setExercises([]);
    setSelectedTarget("all");
    startTransition(() => setVisibleCount(EXERCISE_PAGE_SIZE));
    setSelectedBodyPart(nextBodyPart);
  }

  function handleTargetChange(nextTarget) {
    setSelectedTarget(nextTarget);
    startTransition(() => setVisibleCount(EXERCISE_PAGE_SIZE));
  }

  function handleSearchChange(event) {
    setSearch(event.target.value);
    startTransition(() => setVisibleCount(EXERCISE_PAGE_SIZE));
  }

  function handleAddExercise(exercise) {
    if (!selectedWorkout) {
      return;
    }

    upsertExercises([exercise]);
    addExercisesToWorkout(selectedWorkout.id, [exercise.id]);
  }

  function handleReload() {
    setStatus("loading");
    setErrorMessage("");
    setExercises([]);
    setRequestKey((value) => value + 1);
  }

  function closeExerciseModal() {
    setActiveExerciseId(null);
  }

  function openExerciseModal(exercise) {
    setActiveExerciseId(exercise.id);
  }

  return (
    <PageFrame className="gap-5">
      <StrongSurface className="overflow-hidden rounded-[28px] p-0">
        <div className="relative isolate overflow-hidden rounded-[28px] p-6 md:p-8">
          <div className={cn("absolute inset-0 bg-gradient-to-br", activeBodyPartMeta.accent)} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_22%),linear-gradient(180deg,rgba(8,10,15,0.1),rgba(8,10,15,0.86))]" />

          <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/78">
                <Sparkles className="size-4 text-[var(--accent)]" />
                biblioteca exercicios
              </div>

              <div className="max-w-3xl space-y-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/62">exercise db / rapidapi</p>
                <h1 className="text-4xl font-semibold tracking-[-0.08em] text-white md:text-5xl">
                  Explore exercicios por grupo muscular com vibe Hevy, Fitbod e Smart Fit.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                  Escolha um grupo, refine por musculo alvo, busque por nome e adicione os exercicios direto no treino
                  atual sem sair da tela.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/8 bg-black/18 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/56">grupo ativo</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">{activeBodyPartMeta.label}</p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-black/18 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/56">resultados</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">{filteredExercises.length}</p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-black/18 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/56">treino alvo</p>
                  <p className="mt-3 truncate text-lg font-semibold tracking-[-0.05em] text-white">
                    {selectedWorkout?.title ?? "Nenhum treino ativo"}
                  </p>
                </div>
              </div>
            </div>

            <Surface className="self-end rounded-[24px] border-white/10 bg-black/18 p-5">
              <SectionHeading eyebrow="smart search" title="Monte sua selecao" />

              <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-white/7 bg-white/[0.03] px-4 py-3">
                <Search className="size-4 text-[var(--muted)]" />
                <input
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nome, alvo ou equipamento"
                  className="w-full bg-transparent text-sm text-white placeholder:text-[var(--muted)]"
                />
              </div>

              <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
                <div className="rounded-[18px] border border-white/7 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">fluxo</p>
                  <p className="mt-2 leading-6">
                    Selecione o grupo, refine por target e use o card para adicionar no treino atual com um toque.
                  </p>
                </div>

                <div className="rounded-[18px] border border-white/7 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">treino atual</p>
                  <p className="mt-2 leading-6 text-white/78">
                    {selectedWorkout
                      ? `${selectedWorkout.title} | ${selectedWorkout.exercises.length} exercicios no bloco`
                      : "Abra ou crie um treino para habilitar o botao de adicionar."}
                  </p>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </StrongSurface>

      <Surface className="rounded-[24px] p-5 md:p-6">
        <div className="grid gap-5">
          <MuscleFilter
            title="Body parts"
            description="Todos os grupos oficiais da ExerciseDB, traduzidos para o frontend."
            options={BODY_PART_OPTIONS}
            value={selectedBodyPart}
            onChange={handleBodyPartChange}
          />

          <MuscleFilter
            title="Musculo alvo"
            description="Filtros especificos baseados no campo target da API."
            options={targetOptions}
            value={selectedTarget}
            onChange={handleTargetChange}
            countMap={targetCounts}
          />
        </div>
      </Surface>

      <Surface className="rounded-[24px] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">resultado dinamico</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
              {activeBodyPartMeta.label} com foco em {selectedTarget === "all" ? "todos os alvos" : getTargetLabel(selectedTarget)}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {status === "success"
                ? `${filteredExercises.length} exercicios prontos para explorar e adicionar ao treino.`
                : "Preparando a biblioteca visual do grupo selecionado."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar exercicio"
              className="min-w-[220px] md:w-[280px]"
            />
            <Button variant="secondary" onClick={handleReload} className="gap-2">
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </Surface>

      {status === "error" ? (
        <Surface className="rounded-[24px] border border-[rgba(255,157,92,0.24)] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-[14px] bg-[rgba(255,157,92,0.14)] p-3 text-[var(--warn)]">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Falha ao carregar a ExerciseDB</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{errorMessage}</p>
              </div>
            </div>

            <Button onClick={handleReload} className="gap-2">
              <RefreshCw className="size-4" />
              Tentar novamente
            </Button>
          </div>
        </Surface>
      ) : null}

      {status === "loading" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: EXERCISE_PAGE_SIZE }).map((_, index) => (
            <ExerciseSkeletonCard key={`exercise-skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {status === "success" ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedBodyPart}-${selectedTarget}-${deferredSearch}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-5"
          >
            {visibleExercises.length ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onOpen={() => openExerciseModal(exercise)}
                      isAdded={selectedWorkoutExerciseIds.has(exercise.id)}
                      disabled={!selectedWorkout}
                      onAdd={() => handleAddExercise(exercise)}
                    />
                  ))}
                </div>

                {hasMore ? (
                  <div className="flex justify-center">
                    <Button variant="secondary" onClick={() => setVisibleCount((value) => value + EXERCISE_PAGE_SIZE)} className="gap-2">
                      Mostrar mais
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <Surface className="rounded-[24px] border border-dashed border-white/10 p-8 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                  <div className="rounded-[16px] bg-white/[0.04] p-3 text-[var(--accent)]">
                    <Target className="size-5" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">Nenhum exercicio encontrado</h3>
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    Ajuste a busca ou troque o filtro de target para ampliar os resultados deste grupo muscular.
                  </p>
                </div>
              </Surface>
            )}
          </motion.div>
        </AnimatePresence>
      ) : null}

      <Surface className="rounded-[22px] bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="rounded-[14px] bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
            <Dumbbell className="size-4" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">producao</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              A chave RapidAPI permanece fora do frontend e os GIFs possuem fallback visual para manter a tela estavel
              mesmo quando a origem externa oscila.
            </p>
          </div>
        </div>
      </Surface>

      <AnimatePresence>
        {activeExercise ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <button
              type="button"
              aria-label="Fechar detalhe do exercicio"
              onClick={closeExerciseModal}
              className="absolute inset-0 bg-black/72 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(7,9,13,0.96)] shadow-[0_36px_120px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 md:px-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">exercicio</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                    {activeExerciseDetail?.name ?? activeExercise.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeExerciseModal}
                  className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-white/78 transition hover:bg-white/[0.08]"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid gap-5 p-5 md:p-6">
                <div className="overflow-hidden rounded-[24px] border border-white/8 bg-black">
                  {activeExercise?.videoUrl ? (
                    <video
                      key={activeExercise.videoUrl}
                      src={activeExercise.videoUrl}
                      poster={activeExercise.mediaUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <img
                      src={activeExercise.mediaUrl}
                      alt={activeExercise.name}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--muted)]">
                      {activeExercise.videoUrl
                        ? "GIF carregado. O restante da tela permanece desfocado enquanto voce analisa o movimento."
                        : "Este exercicio nao trouxe GIF neste momento. Mantive a imagem oficial da API."}
                    </p>
                    <p className="text-sm text-white/72">
                      {activeExercise.bodyPartLabel} / {activeExercise.equipment}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleAddExercise(activeExercise)}
                    disabled={!selectedWorkout || selectedWorkoutExerciseIds.has(activeExercise.id)}
                    className="min-w-[220px] gap-2"
                  >
                    {selectedWorkoutExerciseIds.has(activeExercise.id) ? "Adicionado ao treino" : "Adicionar ao treino"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageFrame>
  );
}
