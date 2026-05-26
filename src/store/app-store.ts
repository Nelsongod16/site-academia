"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { commentsSeed, demoUsers, exerciseLibrary, feedSeed, photoSeed, runSeed, swimSeed, workoutsSeed } from "@/lib/demo-data";
import { isoNow } from "@/lib/utils";
import type { SessionUser, SharedSnapshot, WorkoutExercise, WorkoutKind } from "@/types/app";

type ConnectionHint = "online" | "offline" | "syncing" | "saved";

interface AppState extends SharedSnapshot {
  hasHydrated: boolean;
  sessionUser: SessionUser | null;
  syncMode: "local" | "firebase-ready" | "firebase-live";
  dashboardOrder: string[];
  quickWorkoutId: string | null;
  commentsByPost: Record<string, { id: string; author: string; text: string; createdAt: string }[]>;
  scrollMemory: Record<string, number>;
  connectionHint: ConnectionHint;
  setHasHydrated: (value: boolean) => void;
  setConnectionHint: (value: ConnectionHint) => void;
  setSyncMode: (value: AppState["syncMode"]) => void;
  signInDemo: (userId?: string) => void;
  signInFirebaseUser: (payload: { uid: string; email: string | null }) => void;
  signOut: () => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleWorkoutCompleted: (workoutId: string) => void;
  addWorkoutNote: (workoutId: string, note: string) => void;
  duplicateWorkout: (workoutId: string) => void;
  duplicateLastWeek: () => void;
  addCustomWorkout: (payload: { title: string; kind: WorkoutKind; durationMinutes: number; muscleGroups: string[] }) => void;
  reorderWorkoutExercises: (workoutId: string, ordered: string[]) => void;
  updateWorkoutExercise: (workoutId: string, exerciseId: string, patch: Partial<WorkoutExercise>) => void;
  addExercisesToWorkout: (workoutId: string, exerciseIds: string[]) => void;
  favoriteExercise: (exerciseId: string) => void;
  addPhotoEntries: (entries: { image: string; thumb?: string; label: string; kind: "progress" | "before-after" | "training"; note?: string }[]) => void;
  addRun: (payload: { km: number; meters: number; time: string }) => void;
  addSwim: (payload: { distance: number; time: string }) => void;
  setQuickWorkout: (workoutId: string | null) => void;
  setDashboardOrder: (order: string[]) => void;
  rememberScroll: (route: string, y: number) => void;
  hydrateSharedSnapshot: (snapshot: SharedSnapshot) => void;
}

const dashboardOrder = ["today", "volume", "activity", "compare"];

function baseSnapshot(): SharedSnapshot {
  return {
    feedPosts: feedSeed,
    commentsByPost: commentsSeed,
    photos: photoSeed,
    workouts: workoutsSeed,
    exercises: exerciseLibrary,
    runs: runSeed,
    swims: swimSeed,
    favoriteExerciseIds: ["supino-reto", "pulley-frontal"],
    recentExerciseIds: ["supino-reto", "corrida-leve", "pulley-frontal"],
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...baseSnapshot(),
      hasHydrated: false,
      sessionUser: null,
      syncMode: "local",
      dashboardOrder,
      quickWorkoutId: "wed",
      scrollMemory: {},
      connectionHint: "saved",
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setConnectionHint: (value) => set({ connectionHint: value }),
      setSyncMode: (value) => set({ syncMode: value }),
      signInDemo: (userId = "user-1") =>
        set({
          sessionUser: demoUsers.find((user) => user.id === userId) ?? demoUsers[0],
        }),
      signInFirebaseUser: ({ uid, email }) =>
        set({
          sessionUser: {
            id: uid,
            email: email ?? "firebase@pulse.app",
            name: email?.split("@")[0] ?? "Firebase User",
            avatar: (email?.slice(0, 2) ?? "FB").toUpperCase(),
            mode: "firebase",
          },
        }),
      signOut: () => set({ sessionUser: null }),
      toggleLike: (postId) =>
        set((state) => ({
          feedPosts: state.feedPosts.map((post) => {
            if (post.id !== postId) {
              return post;
            }

            const userId = state.sessionUser?.id ?? "user-1";
            const alreadyLiked = post.likedByUserIds.includes(userId);
            const likedByUserIds = alreadyLiked
              ? post.likedByUserIds.filter((id) => id !== userId)
              : [...post.likedByUserIds, userId];

            return {
              ...post,
              likedByUserIds,
              likes: alreadyLiked ? post.likes - 1 : post.likes + 1,
            };
          }),
        })),
      addComment: (postId, text) =>
        set((state) => ({
          commentsByPost: {
            ...state.commentsByPost,
            [postId]: [
              ...(state.commentsByPost[postId] ?? []),
              {
                id: crypto.randomUUID(),
                author: state.sessionUser?.name ?? "Você",
                text,
                createdAt: isoNow(),
              },
            ],
          },
        })),
      toggleWorkoutCompleted: (workoutId) =>
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId ? { ...workout, completed: !workout.completed } : workout,
          ),
          connectionHint: "saved",
        })),
      addWorkoutNote: (workoutId, note) =>
        set((state) => ({
          workouts: state.workouts.map((workout) => (workout.id === workoutId ? { ...workout, quickNote: note } : workout)),
          connectionHint: "saved",
        })),
      duplicateWorkout: (workoutId) =>
        set((state) => {
          const workout = state.workouts.find((item) => item.id === workoutId);

          if (!workout) {
            return state;
          }

          return {
            workouts: [
              ...state.workouts,
              {
                ...workout,
                id: crypto.randomUUID(),
                label: `${workout.label}+`,
                completed: false,
              },
            ],
          };
        }),
      duplicateLastWeek: () =>
        set((state) => ({
          workouts: [
            ...state.workouts,
            ...state.workouts
              .filter((workout) => workout.kind === "gym")
              .map((workout) => ({
                ...workout,
                id: crypto.randomUUID(),
                label: `${workout.label} dup`,
                completed: false,
              })),
          ],
        })),
      addCustomWorkout: ({ title, kind, durationMinutes, muscleGroups }) =>
        set((state) => {
          const colorMap: Record<WorkoutKind, string> = {
            gym: "#9CFF79",
            run: "#4FD1FF",
            swim: "#76B8FF",
            rest: "#C9A7FF",
          };

          const tagsMap: Record<WorkoutKind, AppState["workouts"][number]["tags"]> = {
            gym: ["hipertrofia"],
            run: ["cardio", "resistencia"],
            swim: ["resistencia"],
            rest: ["resistencia"],
          };

          const nextWorkout = {
            id: crypto.randomUUID(),
            label: `Extra ${state.workouts.filter((workout) => workout.kind === kind).length + 1}`,
            date: isoNow(),
            kind,
            title,
            color: colorMap[kind],
            completed: false,
            durationMinutes,
            tags: tagsMap[kind],
            muscleGroups,
            quickNote: "Treino criado rapido para ajustar a semana.",
            exercises: [],
          };

          return {
            workouts: [nextWorkout, ...state.workouts],
            quickWorkoutId: nextWorkout.id,
            connectionHint: "saved",
          };
        }),
      reorderWorkoutExercises: (workoutId, ordered) =>
        set((state) => ({
          workouts: state.workouts.map((workout) => {
            if (workout.id !== workoutId) {
              return workout;
            }

            const nextExercises = ordered
              .map((exerciseId) => workout.exercises.find((exercise) => exercise.exerciseId === exerciseId))
              .filter(Boolean) as WorkoutExercise[];

            return { ...workout, exercises: nextExercises };
          }),
        })),
      updateWorkoutExercise: (workoutId, exerciseId, patch) =>
        set((state) => ({
          workouts: state.workouts.map((workout) => ({
            ...workout,
            exercises:
              workout.id === workoutId
                ? workout.exercises.map((exercise) =>
                    exercise.exerciseId === exerciseId ? { ...exercise, ...patch } : exercise,
                  )
                : workout.exercises,
          })),
          recentExerciseIds: [exerciseId, ...state.recentExerciseIds.filter((id) => id !== exerciseId)].slice(0, 8),
          connectionHint: "saved",
        })),
      addExercisesToWorkout: (workoutId, exerciseIds) =>
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: [
                    ...workout.exercises,
                    ...exerciseIds
                      .filter((exerciseId) => !workout.exercises.some((item) => item.exerciseId === exerciseId))
                      .map((exerciseId) => ({
                        exerciseId,
                        sets: 3,
                        reps: "10-12",
                        weight: "carga livre",
                      })),
                  ],
                }
              : workout,
          ),
          recentExerciseIds: [...exerciseIds, ...state.recentExerciseIds.filter((id) => !exerciseIds.includes(id))].slice(0, 10),
        })),
      favoriteExercise: (exerciseId) =>
        set((state) => ({
          favoriteExerciseIds: state.favoriteExerciseIds.includes(exerciseId)
            ? state.favoriteExerciseIds.filter((id) => id !== exerciseId)
            : [exerciseId, ...state.favoriteExerciseIds],
        })),
      addPhotoEntries: (entries) =>
        set((state) => ({
          photos: [
            ...entries.map((entry) => ({
              id: crypto.randomUUID(),
              authorId: state.sessionUser?.id ?? "user-1",
              createdAt: isoNow(),
              ...entry,
            })),
            ...state.photos,
          ],
        })),
      addRun: (payload) =>
        set((state) => ({
          runs: [{ id: crypto.randomUUID(), createdAt: isoNow(), ...payload }, ...state.runs],
          connectionHint: "saved",
        })),
      addSwim: (payload) =>
        set((state) => ({
          swims: [{ id: crypto.randomUUID(), createdAt: isoNow(), ...payload }, ...state.swims],
          connectionHint: "saved",
        })),
      setQuickWorkout: (workoutId) => set({ quickWorkoutId: workoutId }),
      setDashboardOrder: (order) => set({ dashboardOrder: order }),
      rememberScroll: (route, y) =>
        set((state) => ({
          scrollMemory: {
            ...state.scrollMemory,
            [route]: y,
          },
        })),
      hydrateSharedSnapshot: (snapshot) =>
        set({
          ...snapshot,
          syncMode: "firebase-live",
        }),
    }),
    {
      name: "pulse-studio-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        feedPosts: state.feedPosts,
        commentsByPost: state.commentsByPost,
        photos: state.photos,
        workouts: state.workouts,
        exercises: state.exercises,
        runs: state.runs,
        swims: state.swims,
        favoriteExerciseIds: state.favoriteExerciseIds,
        recentExerciseIds: state.recentExerciseIds,
        dashboardOrder: state.dashboardOrder,
        quickWorkoutId: state.quickWorkoutId,
        sessionUser: state.sessionUser,
        scrollMemory: state.scrollMemory,
      }),
    },
  ),
);

export function getSharedSnapshot(state: AppState): SharedSnapshot {
  return {
    feedPosts: state.feedPosts,
    commentsByPost: state.commentsByPost,
    photos: state.photos,
    workouts: state.workouts,
    exercises: state.exercises,
    runs: state.runs,
    swims: state.swims,
    favoriteExerciseIds: state.favoriteExerciseIds,
    recentExerciseIds: state.recentExerciseIds,
  };
}
