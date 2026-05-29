"use client";

import axios from "axios";

export const EXERCISE_PAGE_SIZE = 9;
export const EXERCISE_FALLBACK_IMAGE = "/exercise-fallback.svg";
export const FREE_EXERCISE_DB_IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export const BODY_PART_OPTIONS = [
  { label: "Costas", value: "back", accent: "from-sky-400/24 via-sky-400/8 to-transparent" },
  { label: "Cardio", value: "cardio", accent: "from-rose-400/24 via-rose-400/8 to-transparent" },
  { label: "Peito", value: "chest", accent: "from-[var(--accent-soft)] via-[var(--accent-soft)]/40 to-transparent" },
  { label: "Antebraco", value: "lower arms", accent: "from-amber-300/22 via-amber-300/8 to-transparent" },
  { label: "Panturrilha", value: "lower legs", accent: "from-emerald-300/22 via-emerald-300/8 to-transparent" },
  { label: "Pescoco", value: "neck", accent: "from-fuchsia-300/20 via-fuchsia-300/6 to-transparent" },
  { label: "Ombros", value: "shoulders", accent: "from-cyan-300/22 via-cyan-300/8 to-transparent" },
  { label: "Bracos", value: "upper arms", accent: "from-orange-300/22 via-orange-300/8 to-transparent" },
  { label: "Pernas", value: "upper legs", accent: "from-lime-300/22 via-lime-300/8 to-transparent" },
  { label: "Abdomen/Core", value: "waist", accent: "from-violet-300/22 via-violet-300/8 to-transparent" },
];

export const TARGET_FILTER_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Lombar", value: "spine" },
  { label: "Trapezio", value: "traps" },
  { label: "Dorsal", value: "lats" },
  { label: "Gluteo", value: "glutes" },
  { label: "Abdutor", value: "abductors" },
  { label: "Adutor", value: "adductors" },
  { label: "Antebraco", value: "forearms" },
  { label: "Biceps", value: "biceps" },
  { label: "Triceps", value: "triceps" },
  { label: "Ombro", value: "delts" },
  { label: "Peitoral", value: "pectorals" },
  { label: "Quadriceps", value: "quads" },
  { label: "Posterior", value: "hamstrings" },
  { label: "Panturrilha", value: "calves" },
  { label: "Abdomen", value: "abs" },
];

const BODY_PART_LABELS = Object.fromEntries(BODY_PART_OPTIONS.map((option) => [option.value, option.label]));
const TARGET_LABELS = Object.fromEntries(TARGET_FILTER_OPTIONS.filter((option) => option.value !== "all").map((option) => [option.value, option.label]));

const EQUIPMENT_LABELS = {
  assisted: "Assistido",
  band: "Banda elastica",
  barbell: "Barra",
  "body weight": "Peso corporal",
  bosu: "Bosu",
  cable: "Cabo",
  dumbbell: "Halter",
  "ez barbell": "Barra EZ",
  kettlebell: "Kettlebell",
  leverage: "Alavanca",
  machine: "Maquina",
  "medicine ball": "Medicine ball",
  olympic: "Olimpico",
  rope: "Corda",
  roller: "Rolo",
  "skierg machine": "SkiErg",
  "sled machine": "Sled",
  smith: "Smith",
  "stability ball": "Bola suica",
  trap: "Trap bar",
  weighted: "Com carga",
};

function humanizeText(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBodyPart(value = "") {
  return String(value).toLowerCase().replace(/_/g, " ").trim();
}

function normalizeTargetValue(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBodyPartLabel(bodyPart) {
  return BODY_PART_LABELS[bodyPart] ?? humanizeText(bodyPart);
}

export function getTargetLabel(target) {
  return TARGET_LABELS[target] ?? humanizeText(target);
}

export function getEquipmentLabel(equipment) {
  return EQUIPMENT_LABELS[equipment] ?? humanizeText(equipment);
}

export function normalizeExercise(item) {
  const bodyPart = normalizeBodyPart(item?.body_part ?? item?.category);
  const target = normalizeTargetValue(Array.isArray(item?.primaryMuscles) ? item.primaryMuscles[0] : item?.target);
  const name = humanizeText(item?.name ?? "Exercicio");
  const instructions = Array.isArray(item?.instructions)
    ? item.instructions.filter(Boolean)
    : Array.isArray(item?.instruction_steps?.en)
      ? item.instruction_steps.en.filter(Boolean)
      : typeof item?.instructions?.en === "string"
        ? [item.instructions.en]
        : [];
  const secondaryMuscles = Array.isArray(item?.secondaryMuscles)
    ? item.secondaryMuscles.map((muscle) => getTargetLabel(normalizeTargetValue(muscle)))
    : Array.isArray(item?.secondary_muscles)
      ? item.secondary_muscles.map((muscle) => getTargetLabel(normalizeTargetValue(muscle)))
    : [];
  const equipment = Array.isArray(item?.equipments)
    ? item.equipments[0]?.toLowerCase() ?? "body weight"
    : String(item?.equipment ?? "body weight").toLowerCase();
  const imagePath = Array.isArray(item?.images) ? item.images[0] : item?.image;
  const fallbackImagePath = Array.isArray(item?.images) ? item.images[1] : item?.image;
  const gifPath = item?.gif_url || item?.gifUrl;
  const mediaUrl = imagePath ? `${FREE_EXERCISE_DB_IMAGE_BASE}${imagePath}` : EXERCISE_FALLBACK_IMAGE;
  const imageFallbackUrl = fallbackImagePath ? `${FREE_EXERCISE_DB_IMAGE_BASE}${fallbackImagePath}` : EXERCISE_FALLBACK_IMAGE;
  const animationUrl = gifPath ? `${FREE_EXERCISE_DB_IMAGE_BASE}${gifPath}` : undefined;

  return {
    id: `free-exdb-${item?.id ?? slugify(`${name}-${bodyPart}-${target}`)}`,
    apiExerciseId: item?.id ? String(item.id) : undefined,
    name,
    muscle: getTargetLabel(target || bodyPart),
    secondaryMuscles: secondaryMuscles.length ? secondaryMuscles : [getBodyPartLabel(bodyPart)],
    category: String(item?.exerciseType ?? item?.category ?? (bodyPart === "cardio" ? "cardio" : "hipertrofia")).toLowerCase(),
    difficulty: "intermediario",
    equipment: getEquipmentLabel(equipment),
    isMachine: /machine|smith|leverage|cable/i.test(equipment),
    description: item?.overview || `${getBodyPartLabel(bodyPart)} com foco principal em ${getTargetLabel(target || bodyPart).toLowerCase()}.`,
    execution:
      instructions.slice(0, 2).join(" ") || `Execute ${name.toLowerCase()} com amplitude controlada e boa estabilidade.`,
    mediaUrl,
    relatedIds: Array.isArray(item?.relatedExerciseIds) ? item.relatedExerciseIds.map(String) : [],
    bodyPart,
    target,
    instructions,
    videoUrl: animationUrl,
    imageFallbackUrl,
    source: "exercisedb",
  };
}

export async function fetchExercisesByBodyPart(bodyPart, options = {}) {
  const response = await axios.get("/api/exercises", {
    params: { bodyPart },
    signal: options.signal,
  });

  const exercises = Array.isArray(response.data?.exercises) ? response.data.exercises : [];
  return exercises.map(normalizeExercise);
}
