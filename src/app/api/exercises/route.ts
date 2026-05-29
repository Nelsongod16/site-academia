import { NextResponse } from "next/server";
import exerciseDataset from "@/data/free-exercise-db.json";

const VALID_BODY_PARTS = [
  "back",
  "cardio",
  "chest",
  "lower arms",
  "lower legs",
  "neck",
  "shoulders",
  "upper arms",
  "upper legs",
  "waist",
] as const;

const BODY_PART_MUSCLE_MAP: Record<(typeof VALID_BODY_PARTS)[number], string[]> = {
  back: ["lats", "middle back", "lower back", "traps"],
  cardio: ["cardiovascular system"],
  chest: ["chest"],
  "lower arms": ["forearms"],
  "lower legs": ["calves"],
  neck: ["neck"],
  shoulders: ["shoulders"],
  "upper arms": ["biceps", "triceps"],
  "upper legs": ["quadriceps", "hamstrings", "glutes", "adductors", "abductors"],
  waist: ["abdominals"],
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bodyPart = searchParams.get("bodyPart")?.trim().toLowerCase();

  if (bodyPart && !VALID_BODY_PARTS.includes(bodyPart as (typeof VALID_BODY_PARTS)[number])) {
    return NextResponse.json({ message: "Grupo muscular invalido para consulta." }, { status: 400 });
  }

  try {
    const exercises = bodyPart
      ? exerciseDataset.filter((exercise) => {
          const mappedMuscles = BODY_PART_MUSCLE_MAP[bodyPart as (typeof VALID_BODY_PARTS)[number]];
          const primaryMuscles = Array.isArray(exercise.primaryMuscles) ? exercise.primaryMuscles.map((muscle) => String(muscle).toLowerCase()) : [];
          const secondaryMuscles = Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles.map((muscle) => String(muscle).toLowerCase()) : [];
          const allMuscles = [...primaryMuscles, ...secondaryMuscles];

          return mappedMuscles.some((muscle) => allMuscles.includes(muscle));
        })
      : exerciseDataset;

    return NextResponse.json(
      {
        bodyPart: bodyPart ?? "all",
        exercises,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ message: "Erro inesperado ao carregar a biblioteca local de exercicios." }, { status: 500 });
  }
}
