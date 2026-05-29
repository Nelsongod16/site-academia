"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { commentsSeed, communityProfiles, demoUsers, exerciseLibrary, feedSeed, photoSeed, runSeed, swimSeed, workoutsSeed } from "@/lib/demo-data";
import { isoNow } from "@/lib/utils";
import type { CustomRoutineConfig, Exercise, FeedPost, RunRoutineConfig, RoutineType, SessionUser, SharedSnapshot, WorkoutExercise, WorkoutKind } from "@/types/app";

type ConnectionHint = "online" | "offline" | "syncing" | "saved";

interface AppState extends SharedSnapshot {
  hasHydrated: boolean;
  sessionUser: SessionUser | null;
  syncMode: "local" | "firebase-ready" | "firebase-live";
  quickWorkoutId: string | null;
  commentsByPost: Record<string, { id: string; author: string; text: string; createdAt: string }[]>;
  scrollMemory: Record<string, number>;
  connectionHint: ConnectionHint;
  setHasHydrated: (value: boolean) => void;
  setConnectionHint: (value: ConnectionHint) => void;
  setSyncMode: (value: AppState["syncMode"]) => void;
  signInDemo: (userId?: string) => void;
  signInFirebaseUser: (payload: { uid: string; email: string | null; emailVerified?: boolean }) => void;
  signInLocalUser: (payload: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    avatarImage?: string;
    username?: string;
    bio?: string;
    emailVerified?: boolean;
    profileCompleted?: boolean;
    city?: string;
    country?: string;
    fitnessGoal?: string;
    trainingStyles?: string[];
    age?: number;
    birthDate?: string;
    weightKg?: number;
    heightCm?: number;
    sex?: SessionUser["sex"];
    visibility?: SessionUser["visibility"];
  }) => void;
  updateSessionUser: (patch: Partial<SessionUser>) => void;
  signOut: () => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleWorkoutCompleted: (workoutId: string) => void;
  addWorkoutNote: (workoutId: string, note: string) => void;
  duplicateWorkout: (workoutId: string) => void;
  deleteWorkoutRoutine: (workoutId: string) => void;
  duplicateLastWeek: () => void;
  addCustomWorkout: (payload: {
    title: string;
    kind: WorkoutKind;
    durationMinutes: number;
    muscleGroups: string[];
    exercises?: WorkoutExercise[];
  }) => void;
  saveWorkoutRoutine: (payload: {
    id?: string;
    title: string;
    durationMinutes: number;
    muscleGroups: string[];
    exercises: WorkoutExercise[];
    kind?: WorkoutKind;
    routineType?: RoutineType;
    quickNote?: string;
    runConfig?: RunRoutineConfig;
    customConfig?: CustomRoutineConfig;
  }) => string;
  reorderWorkoutExercises: (workoutId: string, ordered: string[]) => void;
  updateWorkoutExercise: (workoutId: string, exerciseId: string, patch: Partial<WorkoutExercise>) => void;
  addExercisesToWorkout: (workoutId: string, exerciseIds: string[]) => void;
  upsertExercises: (payload: Exercise[]) => void;
  addFeedPost: (payload: { caption: string; image: string; activityLabel?: string; metricLabel?: string; type?: FeedPost["type"] }) => void;
  favoriteExercise: (exerciseId: string) => void;
  toggleFollowProfile: (profileId: string) => void;
  toggleFriendProfile: (profileId: string) => void;
  addPhotoEntries: (entries: { image: string; thumb?: string; label: string; kind: "progress" | "before-after" | "training"; note?: string }[]) => void;
  addRun: (payload: { km: number; meters: number; time: string }) => void;
  addSwim: (payload: { distance: number; time: string }) => void;
  setQuickWorkout: (workoutId: string | null) => void;
  rememberScroll: (route: string, y: number) => void;
  hydrateSharedSnapshot: (snapshot: SharedSnapshot) => void;
}

function baseSnapshot(): SharedSnapshot {
  return {
    feedPosts: feedSeed,
    commentsByPost: commentsSeed,
    profiles: communityProfiles,
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
    (set) => ({
      ...baseSnapshot(),
      hasHydrated: false,
      sessionUser: null,
      syncMode: "local",
      quickWorkoutId: "wed",
      scrollMemory: {},
      connectionHint: "saved",
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setConnectionHint: (value) => set({ connectionHint: value }),
      setSyncMode: (value) => set({ syncMode: value }),
      signInDemo: (userId = "user-1") =>
        set((state) => {
          const profile = state.profiles.find((item) => item.id === userId);
          const fallback = demoUsers.find((user) => user.id === userId) ?? demoUsers[0];

          return {
            sessionUser: profile
              ? {
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  avatar: profile.avatar,
                  avatarImage: profile.avatarImage,
                  bio: profile.bio,
                  mode: "demo",
                }
              : fallback,
          };
        }),
      signInFirebaseUser: ({ uid, email, emailVerified }) =>
        set((state) => {
          const currentSession = state.sessionUser?.id === uid ? state.sessionUser : null;

          return {
            sessionUser: {
              id: uid,
              email: email ?? currentSession?.email ?? "firebase@pulse.app",
              name: currentSession?.name ?? email?.split("@")[0] ?? "Firebase User",
              avatar: currentSession?.avatar ?? (email?.slice(0, 2) ?? "FB").toUpperCase(),
              avatarImage: currentSession?.avatarImage,
              bio: currentSession?.bio ?? "Conta conectada com sincronizacao em tempo real.",
              mode: "firebase",
              username: currentSession?.username,
              emailVerified,
              profileCompleted: currentSession?.profileCompleted,
              city: currentSession?.city,
              country: currentSession?.country,
              fitnessGoal: currentSession?.fitnessGoal,
              trainingStyles: currentSession?.trainingStyles,
              age: currentSession?.age,
              birthDate: currentSession?.birthDate,
              weightKg: currentSession?.weightKg,
              heightCm: currentSession?.heightCm,
              sex: currentSession?.sex,
              visibility: currentSession?.visibility,
            },
          };
        }),
      signInLocalUser: (payload) =>
        set({
          sessionUser: {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            avatar: payload.avatar ?? payload.name.slice(0, 2).toUpperCase(),
            avatarImage: payload.avatarImage,
            bio: payload.bio,
            mode: "local",
            username: payload.username,
            emailVerified: payload.emailVerified ?? true,
            profileCompleted: payload.profileCompleted ?? false,
            city: payload.city,
            country: payload.country,
            fitnessGoal: payload.fitnessGoal,
            trainingStyles: payload.trainingStyles,
            age: payload.age,
            birthDate: payload.birthDate,
            weightKg: payload.weightKg,
            heightCm: payload.heightCm,
            sex: payload.sex,
            visibility: payload.visibility,
          },
        }),
      updateSessionUser: (patch) =>
        set((state) => ({
          sessionUser: state.sessionUser ? { ...state.sessionUser, ...patch } : null,
        })),
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
                author: state.sessionUser?.name ?? "Voce",
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
      deleteWorkoutRoutine: (workoutId) =>
        set((state) => ({
          workouts: state.workouts.filter((workout) => workout.id !== workoutId),
          quickWorkoutId: state.quickWorkoutId === workoutId ? state.workouts.find((workout) => workout.id !== workoutId)?.id ?? null : state.quickWorkoutId,
          connectionHint: "saved",
        })),
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
      addCustomWorkout: ({ title, kind, durationMinutes, muscleGroups, exercises = [] }) =>
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
            exercises,
          };

          return {
            workouts: [nextWorkout, ...state.workouts],
            quickWorkoutId: nextWorkout.id,
            connectionHint: "saved",
          };
        }),
      saveWorkoutRoutine: ({ id, title, durationMinutes, muscleGroups, exercises, kind = "gym", routineType = "strength", quickNote, runConfig, customConfig }) => {
        const routineId = id ?? crypto.randomUUID();

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

          const nextWorkout: AppState["workouts"][number] = {
            id: routineId,
            label: title.trim().slice(0, 3) || `R${state.workouts.length + 1}`,
            date: isoNow(),
            kind,
            title: title.trim(),
            color: colorMap[kind],
            completed: false,
            durationMinutes,
            tags: tagsMap[kind],
            muscleGroups,
            quickNote: quickNote ?? "Rotina personalizada criada na biblioteca de treinos.",
            exercises,
            routineType,
            runConfig,
            customConfig,
          };

          return {
            workouts: state.workouts.some((workout) => workout.id === routineId)
              ? state.workouts.map((workout) => (workout.id === routineId ? { ...workout, ...nextWorkout } : workout))
              : [nextWorkout, ...state.workouts],
            quickWorkoutId: routineId,
            connectionHint: "saved",
          };
        });

        return routineId;
      },
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
      upsertExercises: (payload) =>
        set((state) => {
          const nextExercises = [...state.exercises];
          const indexById = new Map(nextExercises.map((exercise, index) => [exercise.id, index]));

          payload.forEach((exercise) => {
            const existingIndex = indexById.get(exercise.id);

            if (existingIndex === undefined) {
              indexById.set(exercise.id, nextExercises.length);
              nextExercises.push(exercise);
              return;
            }

            nextExercises[existingIndex] = {
              ...nextExercises[existingIndex],
              ...exercise,
            };
          });

          return {
            exercises: nextExercises,
            connectionHint: "saved",
          };
        }),
      addFeedPost: ({ caption, image, activityLabel, metricLabel, type = "workout" }) =>
        set((state) => {
          const sessionUser = state.sessionUser;

          if (!sessionUser) {
            return state;
          }

          return {
            feedPosts: [
              {
                id: crypto.randomUUID(),
                authorId: sessionUser.id,
                authorName: sessionUser.name,
                avatar: sessionUser.avatar,
                activityLabel: activityLabel ?? "Novo post no feed",
                metricLabel,
                type,
                caption: caption.trim(),
                image,
                createdAt: isoNow(),
                likes: 0,
                likedByUserIds: [],
                streakDays: 1,
                consecutiveDays: 1,
                statsLabel: metricLabel ?? "update",
              },
              ...state.feedPosts,
            ],
            connectionHint: "saved",
          };
        }),
      favoriteExercise: (exerciseId) =>
        set((state) => ({
          favoriteExerciseIds: state.favoriteExerciseIds.includes(exerciseId)
            ? state.favoriteExerciseIds.filter((id) => id !== exerciseId)
            : [exerciseId, ...state.favoriteExerciseIds],
        })),
      toggleFollowProfile: (profileId) =>
        set((state) => {
          const currentUserId = state.sessionUser?.id ?? "user-1";

          if (profileId === currentUserId) {
            return state;
          }

          let followDelta = 0;
          const profiles = state.profiles
            .map((profile) => {
              if (profile.id !== profileId) {
                return profile;
              }

              const isFollowing = !profile.isFollowing;
              followDelta = isFollowing ? 1 : -1;

              return {
                ...profile,
                isFollowing,
                isFriend: isFollowing ? profile.isFriend : false,
                followers: Math.max(0, profile.followers + followDelta),
              };
            })
            .map((profile) =>
              profile.id === currentUserId
                ? { ...profile, following: Math.max(0, profile.following + followDelta) }
                : profile,
            );

          return {
            profiles,
            connectionHint: "saved",
          };
        }),
      toggleFriendProfile: (profileId) =>
        set((state) => {
          const currentUserId = state.sessionUser?.id ?? "user-1";

          if (profileId === currentUserId) {
            return state;
          }

          let followDelta = 0;
          const profiles = state.profiles
            .map((profile) => {
              if (profile.id !== profileId) {
                return profile;
              }

              const isFriend = !profile.isFriend;
              const needsFollow = isFriend && !profile.isFollowing;

              if (needsFollow) {
                followDelta = 1;
              }

              return {
                ...profile,
                isFriend,
                isFollowing: needsFollow ? true : profile.isFollowing,
                followers: Math.max(0, profile.followers + followDelta),
              };
            })
            .map((profile) =>
              profile.id === currentUserId
                ? { ...profile, following: Math.max(0, profile.following + followDelta) }
                : profile,
            );

          return {
            profiles,
            connectionHint: "saved",
          };
        }),
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
      rememberScroll: (route, y) =>
        set((state) => ({
          scrollMemory: {
            ...state.scrollMemory,
            [route]: y,
          },
        })),
      hydrateSharedSnapshot: (snapshot) =>
        set({
          ...baseSnapshot(),
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
        profiles: state.profiles,
        photos: state.photos,
        workouts: state.workouts,
        exercises: state.exercises,
        runs: state.runs,
        swims: state.swims,
        favoriteExerciseIds: state.favoriteExerciseIds,
        recentExerciseIds: state.recentExerciseIds,
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
    profiles: state.profiles,
    photos: state.photos,
    workouts: state.workouts,
    exercises: state.exercises,
    runs: state.runs,
    swims: state.swims,
    favoriteExerciseIds: state.favoriteExerciseIds,
    recentExerciseIds: state.recentExerciseIds,
  };
}
