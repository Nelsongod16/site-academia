import { eachWeekOfInterval, endOfMonth, endOfWeek, format, isSameWeek, parseISO, startOfMonth, startOfWeek, subWeeks } from "date-fns";

import type { Exercise, RunEntry, SwimEntry, WorkoutDay } from "@/types/app";

export function monthlyWorkoutCount(workouts: WorkoutDay[]) {
  const now = new Date();
  return workouts.filter((workout) => {
    const date = parseISO(workout.date);
    return date >= startOfMonth(now) && date <= endOfMonth(now) && workout.completed;
  }).length;
}

export function totalMinutes(workouts: WorkoutDay[]) {
  return workouts.filter((workout) => workout.completed).reduce((sum, workout) => sum + workout.durationMinutes, 0);
}

export function currentStreak(workouts: WorkoutDay[]) {
  return workouts.reduce((count, workout) => count + (workout.completed ? 1 : 0), 0);
}

export function weeklyVolume(workouts: WorkoutDay[]) {
  const start = startOfWeek(subWeeks(new Date(), 5), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });

  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((weekStart) => ({
    label: format(weekStart, "dd/MM"),
    total: workouts
      .filter((workout) => isSameWeek(parseISO(workout.date), weekStart, { weekStartsOn: 1 }))
      .reduce((sum, workout) => sum + workout.durationMinutes, 0),
  }));
}

export function muscleFrequency(workouts: WorkoutDay[]) {
  const counts = new Map<string, number>();

  workouts.forEach((workout) => {
    workout.muscleGroups.forEach((muscle) => {
      counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
    });
  });

  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

export function monthlyRunDistance(runs: RunEntry[]) {
  return runs.reduce((sum, run) => sum + run.km + run.meters / 1000, 0);
}

export function trainingOverview(workouts: WorkoutDay[], runs: RunEntry[], swims: SwimEntry[]) {
  return [
    { label: "Gym", value: workouts.filter((item) => item.kind === "gym" && item.completed).length },
    { label: "Run", value: runs.length },
    { label: "Swim", value: swims.length },
  ];
}

export function exerciseUsage(workouts: WorkoutDay[], exercises: Exercise[]) {
  return exercises
    .map((exercise) => ({
      name: exercise.name,
      totalSets: workouts.reduce((sum, workout) => {
        const record = workout.exercises.find((item) => item.exerciseId === exercise.id);
        return sum + (record?.sets ?? 0);
      }, 0),
    }))
    .filter((item) => item.totalSets > 0)
    .slice(0, 6);
}
