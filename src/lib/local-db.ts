import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { formatUsername, normalizeUsername } from "@/lib/social-utils";
import { initials, isoNow } from "@/lib/utils";
import type { SessionUser } from "@/types/app";
import type { SocialProfileInput } from "@/types/social";

const scrypt = promisify(scryptCallback);
const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "local-db.json");

type LocalProfileRecord = SocialProfileInput & {
  updatedAt: string;
};

type LocalUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
  profile: LocalProfileRecord | null;
};

type LocalDatabase = {
  users: LocalUserRecord[];
};

async function ensureDatabase() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    const raw = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      users: parsed.users ?? [],
    } satisfies LocalDatabase;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const nextDb: LocalDatabase = { users: [] };
    await fs.writeFile(dataFile, JSON.stringify(nextDb, null, 2), "utf8");
    return nextDb;
  }
}

async function saveDatabase(database: LocalDatabase) {
  await fs.writeFile(dataFile, JSON.stringify(database, null, 2), "utf8");
}

async function hashPassword(password: string, salt: string) {
  const buffer = (await scrypt(password, salt, 64)) as Buffer;
  return buffer.toString("hex");
}

function buildDefaultProfile(email: string): LocalProfileRecord {
  const emailPrefix = email.split("@")[0] ?? "usuario";
  const cleanName = emailPrefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
  const fullName = cleanName || "Novo Usuario";
  const now = isoNow();

  return {
    fullName,
    username: normalizeUsername(emailPrefix) || `usuario-${Math.floor(Math.random() * 1000)}`,
    avatarUrl: "",
    bio: "Perfil criado localmente no app.",
    city: "Sao Paulo",
    country: "Brasil",
    fitnessGoal: "consistencia",
    trainingStyles: ["musculacao"],
    age: 25,
    birthDate: "",
    weightKg: 70,
    heightCm: 170,
    sex: "nao-informar",
    visibility: "public",
    updatedAt: now,
  };
}

function toSessionUser(record: LocalUserRecord): SessionUser {
  const profile = record.profile ?? buildDefaultProfile(record.email);
  const username = formatUsername(profile.username);

  return {
    id: record.id,
    email: record.email,
    name: profile.fullName,
    avatar: initials(profile.fullName),
    avatarImage: profile.avatarUrl || undefined,
    bio: profile.bio,
    mode: "local",
    username,
    emailVerified: true,
    profileCompleted: Boolean(profile.fullName && profile.username),
    city: profile.city,
    country: profile.country,
    fitnessGoal: profile.fitnessGoal,
    trainingStyles: profile.trainingStyles,
    age: profile.age,
    birthDate: profile.birthDate,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    sex: profile.sex,
    visibility: profile.visibility,
  };
}

function assertPasswordStrength(password: string) {
  if (password.trim().length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }
}

function assertUniqueUsername(database: LocalDatabase, userId: string, username: string) {
  const usernameKey = normalizeUsername(username);
  const conflict = database.users.find((user) => user.id !== userId && normalizeUsername(user.profile?.username ?? "") === usernameKey);

  if (conflict) {
    throw new Error("Esse username ja esta em uso.");
  }
}

export async function createLocalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  assertPasswordStrength(password);

  if (!normalizedEmail) {
    throw new Error("Informe um e-mail valido.");
  }

  const database = await ensureDatabase();

  if (database.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("Ja existe uma conta com esse e-mail.");
  }

  const salt = randomUUID();
  const now = isoNow();
  const nextUser: LocalUserRecord = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password, salt),
    passwordSalt: salt,
    createdAt: now,
    updatedAt: now,
    profile: buildDefaultProfile(normalizedEmail),
  };

  database.users.push(nextUser);
  await saveDatabase(database);

  return toSessionUser(nextUser);
}

export async function authenticateLocalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const database = await ensureDatabase();
  const user = database.users.find((item) => item.email === normalizedEmail);

  if (!user) {
    throw new Error("Conta nao encontrada.");
  }

  const nextHash = await hashPassword(password, user.passwordSalt);
  const currentHash = Buffer.from(user.passwordHash, "hex");
  const incomingHash = Buffer.from(nextHash, "hex");

  if (currentHash.length !== incomingHash.length || !timingSafeEqual(currentHash, incomingHash)) {
    throw new Error("Senha incorreta.");
  }

  return toSessionUser(user);
}

export async function updateLocalUserProfile(userId: string, input: SocialProfileInput) {
  const database = await ensureDatabase();
  const user = database.users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("Conta nao encontrada.");
  }

  if (!input.fullName.trim() || !input.username.trim()) {
    throw new Error("Nome e username sao obrigatorios.");
  }

  assertUniqueUsername(database, userId, input.username);

  user.profile = {
    ...input,
    username: normalizeUsername(input.username),
    updatedAt: isoNow(),
  };
  user.updatedAt = isoNow();
  await saveDatabase(database);

  return toSessionUser(user);
}
