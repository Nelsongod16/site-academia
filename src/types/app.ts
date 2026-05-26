export type TrainingTag = "forca" | "hipertrofia" | "cardio" | "resistencia";
export type ExerciseDifficulty = "iniciante" | "intermediario" | "avancado";
export type EquipmentType = "maquina" | "halter" | "barra" | "peso corporal" | "cabo";
export type WorkoutKind = "gym" | "run" | "swim" | "rest";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  mode: "demo" | "firebase";
  avatarImage?: string;
  bio?: string;
}

export interface FeedComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface FeedPost {
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
  runTime?: string;
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
  category: "forca" | "hipertrofia" | "cardio" | "resistencia";
  difficulty: ExerciseDifficulty;
  equipment: EquipmentType;
  isMachine: boolean;
  description: string;
  execution: string;
  mediaUrl: string;
  videoUrl?: string;
  favorite?: boolean;
  relatedIds: string[];
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  weight: string;
  note?: string;
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
