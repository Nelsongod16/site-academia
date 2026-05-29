import { getSupabaseClient } from "@/lib/firebase/client";
import { loginLocalBrowserUser, registerLocalBrowserUser, updateLocalBrowserProfile } from "@/lib/local-auth";
import type { SessionUser } from "@/types/app";

function mapAuthError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("email rate limit exceeded")) {
    return "Voce atingiu o limite de envio de e-mails. Aguarde alguns minutos antes de tentar de novo.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme o e-mail da conta antes de entrar.";
  }

  return message ?? "Nao foi possivel concluir a autenticacao.";
}

function getEmailRedirectTo() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "") + "/";
  }

  if (typeof window === "undefined") {
    return "https://site-academia-eight.vercel.app/";
  }

  return `${window.location.origin.replace(/\/+$/, "")}/`;
}

function toAuthPayload(user: { id: string; email?: string | null; email_confirmed_at?: string | null }) {
  return {
    user: {
      uid: user.id,
      email: user.email ?? null,
      emailVerified: Boolean(user.email_confirmed_at),
    },
  };
}

export async function loginWithFirebase(email: string, password: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(mapAuthError(error?.message) ?? "Nao foi possivel entrar.");
  }

  return toAuthPayload(data.user);
}

export async function registerWithFirebase(email: string, password: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
    },
  });

  if (error || !data.user) {
    throw new Error(mapAuthError(error?.message) ?? "Nao foi possivel criar a conta.");
  }

  return {
    ...toAuthPayload(data.user),
    requiresEmailConfirmation: !data.session && !data.user.email_confirmed_at,
  };
}

export async function registerWithLocalAccount(email: string, password: string) {
  return registerLocalBrowserUser(email, password);
}

export async function loginWithLocalAccount(email: string, password: string) {
  return loginLocalBrowserUser(email, password);
}

export async function saveLocalProfile(
  userId: string,
  input: {
    fullName: string;
    username: string;
    avatarUrl: string;
    bio: string;
    city: string;
    country: string;
    fitnessGoal: string;
    trainingStyles: string[];
    age: number;
    birthDate: string;
    weightKg: number;
    heightCm: number;
    sex: SessionUser["sex"];
    visibility: SessionUser["visibility"];
  },
) {
  return updateLocalBrowserProfile(userId, {
    fullName: input.fullName,
    username: input.username,
    avatarUrl: input.avatarUrl,
    bio: input.bio,
    city: input.city,
    country: input.country,
    fitnessGoal: input.fitnessGoal,
    trainingStyles: input.trainingStyles,
    age: input.age ?? 25,
    birthDate: input.birthDate ?? "",
    weightKg: input.weightKg ?? 70,
    heightCm: input.heightCm ?? 170,
    sex: input.sex ?? "nao-informar",
    visibility: input.visibility ?? "public",
  });
}

export async function logoutFromFirebase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}

export async function resendFirebaseVerification() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    throw new Error("Nenhum usuario autenticado.");
  }

  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email: data.user.email,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
    },
  });

  if (resendError) {
    throw new Error(mapAuthError(resendError.message));
  }
}

export function watchFirebaseAuth(callback: (payload: { uid: string; email: string | null; emailVerified: boolean } | null) => void) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    callback(null);
    return () => undefined;
  }

  void supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user;
    callback(user ? { uid: user.id, email: user.email ?? null, emailVerified: Boolean(user.email_confirmed_at) } : null);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    callback(user ? { uid: user.id, email: user.email ?? null, emailVerified: Boolean(user.email_confirmed_at) } : null);
  });

  return () => subscription.unsubscribe();
}
