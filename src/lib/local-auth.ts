import { formatUsername, normalizeUsername } from "@/lib/social-utils";
import { initials, isoNow } from "@/lib/utils";
import type { SessionUser } from "@/types/app";
import type { SocialProfileInput } from "@/types/social";

const STORAGE_KEY = "pulse-local-accounts";

type LocalBrowserProfile = SocialProfileInput;

type LocalBrowserAccount = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  profile: LocalBrowserProfile;
};

function getStorage() {
  if (typeof window === "undefined") {
    throw new Error("Armazenamento local indisponivel.");
  }

  return window.localStorage;
}

function readAccounts() {
  const raw = getStorage().getItem(STORAGE_KEY);

  if (!raw) {
    return [] as LocalBrowserAccount[];
  }

  try {
    return JSON.parse(raw) as LocalBrowserAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalBrowserAccount[]) {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(accounts));
}

async function hashPassword(password: string) {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function buildDefaultProfile(email: string): LocalBrowserProfile {
  const emailPrefix = email.split("@")[0] ?? "usuario";
  const fullName =
    emailPrefix
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
      .join(" ") || "Novo Usuario";

  return {
    fullName,
    username: normalizeUsername(emailPrefix) || `usuario-${Math.floor(Math.random() * 1000)}`,
    avatarUrl: "",
    bio: "Conta criada no armazenamento local do navegador.",
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
  };
}

function toSessionUser(account: LocalBrowserAccount): SessionUser {
  return {
    id: account.id,
    email: account.email,
    name: account.profile.fullName,
    avatar: initials(account.profile.fullName),
    avatarImage: account.profile.avatarUrl || undefined,
    bio: account.profile.bio,
    mode: "local",
    username: formatUsername(account.profile.username),
    emailVerified: true,
    profileCompleted: true,
    city: account.profile.city,
    country: account.profile.country,
    fitnessGoal: account.profile.fitnessGoal,
    trainingStyles: account.profile.trainingStyles,
    age: account.profile.age,
    birthDate: account.profile.birthDate,
    weightKg: account.profile.weightKg,
    heightCm: account.profile.heightCm,
    sex: account.profile.sex,
    visibility: account.profile.visibility,
  };
}

export async function registerLocalBrowserUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Informe um e-mail valido.");
  }

  if (password.trim().length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }

  const accounts = readAccounts();

  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error("Ja existe uma conta com esse e-mail.");
  }

  const now = isoNow();
  const nextAccount: LocalBrowserAccount = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
    profile: buildDefaultProfile(normalizedEmail),
  };

  writeAccounts([...accounts, nextAccount]);
  return toSessionUser(nextAccount);
}

export async function loginLocalBrowserUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === normalizedEmail);

  if (!account) {
    throw new Error("Conta nao encontrada.");
  }

  const passwordHash = await hashPassword(password);

  if (passwordHash !== account.passwordHash) {
    throw new Error("Senha incorreta.");
  }

  return toSessionUser(account);
}

export async function updateLocalBrowserProfile(userId: string, input: SocialProfileInput) {
  const accounts = readAccounts();
  const existing = accounts.find((account) => account.id === userId);

  if (!existing) {
    throw new Error("Conta nao encontrada.");
  }

  const normalizedUsername = normalizeUsername(input.username);
  const conflict = accounts.find((account) => account.id !== userId && normalizeUsername(account.profile.username) === normalizedUsername);

  if (conflict) {
    throw new Error("Esse username ja esta em uso.");
  }

  const nextAccounts = accounts.map((account) =>
    account.id === userId
      ? {
          ...account,
          updatedAt: isoNow(),
          profile: {
            ...input,
            username: normalizedUsername,
          },
        }
      : account,
  );

  writeAccounts(nextAccounts);
  return toSessionUser(nextAccounts.find((account) => account.id === userId)!);
}
