"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, LoaderCircle, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "zustand";

import { Button, Chip, Input, StrongSurface, Textarea } from "@/components/ui/kit";
import { saveLocalProfile } from "@/lib/firebase/auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { uploadProfileImage, upsertProfile } from "@/lib/firebase/social";
import { compressImage } from "@/lib/media";
import { initials } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { SocialProfile, SocialProfileInput, SocialSex, SocialVisibility } from "@/types/social";

const trainingStyleOptions = ["musculacao", "corrida", "natacao", "mobilidade", "cross training", "yoga"];
const goalOptions = ["ganho de massa", "perda de gordura", "performance", "saude", "consistencia", "longevidade"];
const visibilityOptions: { label: string; value: SocialVisibility }[] = [
  { label: "perfil publico", value: "public" },
  { label: "so amigos", value: "friends" },
  { label: "privado", value: "private" },
];
const sexOptions: { label: string; value: SocialSex }[] = [
  { label: "feminino", value: "feminino" },
  { label: "masculino", value: "masculino" },
  { label: "nao informar", value: "nao-informar" },
  { label: "outro", value: "outro" },
];

type FormState = SocialProfileInput & {
  avatarFile: File | null;
};

function createInitialState(profile: SocialProfile | null): FormState {
  return {
    fullName: profile?.fullName ?? "",
    username: profile?.username.replace(/^@/, "") ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
    avatarFile: null,
    bio: profile?.bio ?? "",
    city: profile?.city ?? "",
    country: profile?.country ?? "",
    fitnessGoal: profile?.fitnessGoal ?? goalOptions[0],
    trainingStyles: profile?.trainingStyles ?? ["musculacao"],
    age: profile?.age ?? 25,
    birthDate: profile?.birthDate ?? "",
    weightKg: profile?.weightKg ?? 70,
    heightCm: profile?.heightCm ?? 170,
    sex: profile?.sex ?? "nao-informar",
    visibility: profile?.visibility ?? "public",
  };
}

export function ProfileOnboardingModal({
  open,
  mandatory,
  profile,
  onClose,
}: {
  open: boolean;
  mandatory: boolean;
  profile: SocialProfile | null;
  onClose?: () => void;
}) {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const updateSessionUser = useStore(useAppStore, (state) => state.updateSessionUser);
  const signInLocalUser = useStore(useAppStore, (state) => state.signInLocalUser);
  const [form, setForm] = useState<FormState>(() => createInitialState(profile));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const previewAvatar = useMemo(() => {
    if (form.avatarFile) {
      return URL.createObjectURL(form.avatarFile);
    }
    return form.avatarUrl;
  }, [form.avatarFile, form.avatarUrl]);

  useEffect(() => {
    if (!form.avatarFile) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewAvatar);
    };
  }, [form.avatarFile, previewAvatar]);

  if (!open) {
    return null;
  }

  async function handleSave() {
    if (!sessionUser) {
      setError("Voce precisa entrar para salvar o perfil.");
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.username.trim() ||
      !form.birthDate ||
      !form.city.trim() ||
      !form.country.trim() ||
      !form.fitnessGoal.trim() ||
      !form.avatarUrl && !form.avatarFile
    ) {
      setError("Preencha todos os campos principais para liberar o app.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let avatarUrl = form.avatarUrl;

      if (form.avatarFile && hasFirebaseConfig()) {
        avatarUrl = await uploadProfileImage(sessionUser.id, form.avatarFile);
      } else if (form.avatarFile) {
        avatarUrl = await compressImage(form.avatarFile);
      }

      const input: SocialProfileInput = {
        fullName: form.fullName,
        username: form.username,
        avatarUrl,
        bio: form.bio,
        city: form.city,
        country: form.country,
        fitnessGoal: form.fitnessGoal,
        trainingStyles: form.trainingStyles,
        age: Number(form.age),
        birthDate: form.birthDate,
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        sex: form.sex,
        visibility: form.visibility,
      };

      if (hasFirebaseConfig()) {
        await upsertProfile({
          userId: sessionUser.id,
          email: sessionUser.email,
          emailVerified: Boolean(sessionUser.emailVerified),
          input,
        });

        updateSessionUser({
          name: input.fullName,
          avatar: initials(input.fullName),
          avatarImage: avatarUrl,
          username: `@${input.username.replace(/^@/, "")}`,
          bio: input.bio,
          profileCompleted: true,
        });
      } else {
        const localSession = await saveLocalProfile(sessionUser.id, input);
        signInLocalUser(localSession);
      }

      onClose?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="w-full max-w-3xl"
        >
          <StrongSurface className="max-h-[92vh] overflow-y-auto rounded-[30px] p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  {mandatory ? "perfil obrigatorio" : "editar perfil"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.07em]">
                  Complete seu perfil social premium.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Esse card libera a camada social com perfis reais, amizades, feed ao vivo e descoberta por objetivo, cidade e estilo de treino.
                </p>
              </div>
              {mandatory ? (
                <div className="hidden items-center gap-2 rounded-full bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] md:flex">
                  <Lock className="size-3.5" />
                  sem pular
                </div>
              ) : (
                <Button variant="ghost" onClick={onClose}>
                  fechar
                </Button>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="space-y-4">
                <label className="block cursor-pointer overflow-hidden rounded-[28px] border border-white/8 bg-white/4">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {previewAvatar ? (
                      <img src={previewAvatar} alt="Preview do avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-white/5 text-4xl font-semibold text-white/72">
                        {initials(form.fullName || sessionUser?.name || "PS")}
                      </div>
                    )}
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-center rounded-[18px] bg-black/42 px-4 py-3 text-sm backdrop-blur-sm">
                      <Camera className="mr-2 size-4" />
                      enviar foto de perfil
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        avatarFile: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </label>

                <div className="rounded-[22px] border border-white/8 bg-white/[0.035] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">privacidade</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibilityOptions.map((option) => (
                      <Chip
                        key={option.value}
                        active={form.visibility === option.value}
                        onClick={() => setForm((current) => ({ ...current, visibility: option.value }))}
                      >
                        {option.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Nome completo" />
                  <Input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="@username unico" />
                  <Input
                    value={String(form.age)}
                    onChange={(event) => setForm((current) => ({ ...current, age: Number(event.target.value) || 0 }))}
                    placeholder="Idade"
                    type="number"
                  />
                  <Input value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} type="date" />
                  <Input
                    value={String(form.weightKg)}
                    onChange={(event) => setForm((current) => ({ ...current, weightKg: Number(event.target.value) || 0 }))}
                    placeholder="Peso (kg)"
                    type="number"
                    step="0.1"
                  />
                  <Input
                    value={String(form.heightCm)}
                    onChange={(event) => setForm((current) => ({ ...current, heightCm: Number(event.target.value) || 0 }))}
                    placeholder="Altura (cm)"
                    type="number"
                  />
                  <Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Cidade" />
                  <Input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="Pais" />
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">sexo</p>
                  <div className="flex flex-wrap gap-2">
                    {sexOptions.map((option) => (
                      <Chip
                        key={option.value}
                        active={form.sex === option.value}
                        onClick={() => setForm((current) => ({ ...current, sex: option.value }))}
                      >
                        {option.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">objetivo fitness</p>
                  <div className="flex flex-wrap gap-2">
                    {goalOptions.map((option) => (
                      <Chip
                        key={option}
                        active={form.fitnessGoal === option}
                        onClick={() => setForm((current) => ({ ...current, fitnessGoal: option }))}
                      >
                        {option}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">estilo de treino</p>
                  <div className="flex flex-wrap gap-2">
                    {trainingStyleOptions.map((option) => {
                      const active = form.trainingStyles.includes(option);

                      return (
                        <Chip
                          key={option}
                          active={active}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              trainingStyles: active
                                ? current.trainingStyles.filter((item) => item !== option)
                                : [...current.trainingStyles, option],
                            }))
                          }
                        >
                          {option}
                        </Chip>
                      );
                    })}
                  </div>
                </div>

                <Textarea
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  placeholder="Bio curta, objetivo e vibe do seu treino."
                />

                {error ? <p className="text-sm text-[var(--warn)]">{error}</p> : null}

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs leading-6 text-[var(--muted)]">
                    Perfil salvo no banco, pronto para amizade real, busca por cidade/pais e feed com usuarios reais.
                  </p>
                  <Button onClick={() => void handleSave()} disabled={saving} className="min-w-40">
                    {saving ? <LoaderCircle className="size-4 animate-spin" /> : mandatory ? "Liberar app" : "Salvar perfil"}
                  </Button>
                </div>
              </div>
            </div>
          </StrongSurface>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
