import type { RunPostMetrics, SocialSex, SocialVisibility } from "@/types/social";

export type TrainingTag = "forca" | "hipertrofia" | "cardio" | "resistencia";
export type ExerciseDifficulty = "iniciante" | "intermediario" | "avancado";
export type WorkoutKind = "gym" | "run" | "swim" | "rest";
export type RoutineType = "strength" | "run" | "custom";
export type TrainingCalendarStatus = "gym" | "rest";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  mode: "demo" | "firebase" | "local";
  avatarImage?: string;
  bio?: string;
  username?: string;
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
  sex?: SocialSex;
  visibility?: SocialVisibility;
}

export interface FeedComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface FeedPost extends RunPostMetrics {
  id: string;
  authorId: string;
  authorName: string;
  avatar: string;
  activityLabel: string;
  metricLabel?: string;
  type: "workout" | "run" | "swim" | "progress";
  caption: string;
  image: string;
  createdAt: string;
  workoutMinutes?: number;
  runKm?: number;
  swimDistance?: number;
  likes: number;
  likedByUserIds: string[];
  streakDays: number;
  consecutiveDays: number;
  statsLabel: string;
}

export interface AthleteAchievement {
  title: string;
  detail: string;
}

export interface AthleteProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  avatarImage: string;
  coverImage: string;
  bio: string;
  city: string;
  specialty: string;
  followers: number;
  following: number;
  streak: number;
  weeklyFrequency: number;
  totalWorkouts: number;
  totalRuns: number;
  totalDistanceKm: number;
  lastWorkout: string;
  lastRun?: string;
  lastActivity: string;
  achievements: AthleteAchievement[];
  isFollowing: boolean;
  isFriend: boolean;
}

export interface PhotoEntry {
  id: string;
  authorId: string;
  image: string;
  thumb?: string;
  createdAt: string;
  label: string;
  kind: "progress" | "before-after" | "training";
  note?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  secondaryMuscles: string[];
  category: TrainingTag | string;
  difficulty: ExerciseDifficulty | string;
  equipment: string;
  isMachine: boolean;
  description: string;
  execution: string;
  mediaUrl: string;
  videoUrl?: string;
  favorite?: boolean;
  relatedIds: string[];
  apiExerciseId?: string;
  bodyPart?: string;
  target?: string;
  instructions?: string[];
  imageFallbackUrl?: string;
  source?: "local" | "exercisedb";
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  weight: string;
  note?: string;
  restTimer?: string;
  setRows?: Array<{
    weight: string;
    reps: string;
  }>;
}

export interface RunRoutineConfig {
  desiredTime: string;
  desiredDistance: string;
  desiredPace: string;
  actualTime: string;
  actualDistance: string;
  actualPace: string;
  time?: string;
  kms?: string;
  distance?: string;
  pace?: string;
}

export interface CustomRoutineConfig {
  duration: string;
  focus: string;
  note: string;
}

export interface WorkoutDay {
  id: string;
  label: string;
  date: string;
  kind: WorkoutKind;
  title: string;
  color: string;
  completed: boolean;
  durationMinutes: number;
  tags: TrainingTag[];
  muscleGroups: string[];
  quickNote?: string;
  exercises: WorkoutExercise[];
  routineType?: RoutineType;
  runConfig?: RunRoutineConfig;
  customConfig?: CustomRoutineConfig;
}

export interface RunEntry {
  id: string;
  createdAt: string;
  km: number;
  meters: number;
  time: string;
}

export interface SwimEntry {
  id: string;
  createdAt: string;
  distance: number;
  time: string;
}

export interface SharedSnapshot {
  feedPosts: FeedPost[];
  commentsByPost: Record<string, FeedComment[]>;
  profiles: AthleteProfile[];
  photos: PhotoEntry[];
  workouts: WorkoutDay[];
  exercises: Exercise[];
  runs: RunEntry[];
  swims: SwimEntry[];
  favoriteExerciseIds: string[];
  recentExerciseIds: string[];
  updatedAt?: string;
}
