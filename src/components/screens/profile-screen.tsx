"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { ProfileOnboardingModal } from "@/components/social/profile-onboarding-modal";
import { RunPostMetrics } from "@/components/social/run-post-metrics";
import { SocialPostCard } from "@/components/social/social-post-card";
import { Button, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { useCurrentSocialState, useProfilePosts } from "@/hooks/use-social-session";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { currentStreak, totalMinutes } from "@/lib/stats";
import { useAppStore } from "@/store/app-store";
import type { SocialProfile } from "@/types/social";

function createLocalProfile(sessionUser: ReturnType<typeof useAppStore.getState>["sessionUser"]): SocialProfile | null {
  if (!sessionUser) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    fullName: sessionUser.name,
    username: sessionUser.username ?? `@${sessionUser.email.split("@")[0]}`,
    usernameKey: (sessionUser.username ?? sessionUser.email.split("@")[0]).replace(/^@/, "").toLowerCase(),
    avatarUrl: sessionUser.avatarImage ?? "",
    bio: sessionUser.bio ?? "Perfil local pronto para acompanhar seus treinos.",
    city: sessionUser.city ?? "Sao Paulo",
    country: sessionUser.country ?? "Brasil",
    fitnessGoal: sessionUser.fitnessGoal ?? "consistencia",
    trainingStyles: sessionUser.trainingStyles ?? ["musculacao"],
    age: sessionUser.age ?? 25,
    birthDate: sessionUser.birthDate ?? "",
    weightKg: sessionUser.weightKg ?? 70,
    heightCm: sessionUser.heightCm ?? 170,
    sex: sessionUser.sex ?? "nao-informar",
    visibility: sessionUser.visibility ?? "public",
    verifiedEmail: Boolean(sessionUser.emailVerified ?? true),
    profileCompleted: Boolean(sessionUser.profileCompleted ?? true),
    accountStatus: "active",
    moderationState: "clean",
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    searchIndex: [],
  };
}

export function ProfileScreen() {
  const searchParams = useSearchParams();
  const socialReady = hasFirebaseConfig();
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const feedPosts = useStore(useAppStore, (state) => state.feedPosts);
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const photos = useStore(useAppStore, (state) => state.photos);
  const { profile, stats } = useCurrentSocialState();
  const posts = useProfilePosts(profile?.id);

  const activeProfile = socialReady ? profile : createLocalProfile(sessionUser);
  const localStreak = useMemo(() => currentStreak(workouts), [workouts]);
  const localMinutes = useMemo(() => totalMinutes(workouts), [workouts]);
  const recentPhotos = useMemo(() => photos.slice(0, 3), [photos]);
  const localFeedPosts = useMemo(() => feedPosts.filter((post) => post.authorId === sessionUser?.id), [feedPosts, sessionUser?.id]);
  const fallbackProfile = useMemo(() => createLocalProfile(sessionUser), [sessionUser]);
  const forceCompleteProfile = searchParams?.get("completeProfile") === "1";
  const needsProfileCompletion = Boolean(
    sessionUser &&
      (sessionUser.profileCompleted !== true || (socialReady && profile ? !profile.profileCompleted : false)),
  );
  const onboardingProfile = (socialReady ? profile : null) ?? fallbackProfile;

  if (!activeProfile) {
    return (
      <PageFrame>
        {sessionUser ? (
          <ProfileOnboardingModal
            open={forceCompleteProfile || needsProfileCompletion}
            mandatory
            profile={onboardingProfile}
          />
        ) : null}
        <StrongSurface className="rounded-[28px]">
          <h2 className="text-3xl font-semibold tracking-[-0.07em]">Complete seu perfil para liberar a area publica.</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">Assim que o onboarding for concluido, suas estatisticas e seus posts vao aparecer aqui.</p>
        </StrongSurface>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="gap-5">
      {sessionUser ? (
        <ProfileOnboardingModal
          open={forceCompleteProfile || needsProfileCompletion}
          mandatory
          profile={onboardingProfile}
        />
      ) : null}
      <StrongSurface className="overflow-hidden rounded-[30px] p-0">
        <div className="relative min-h-[380px]">
          {activeProfile.avatarUrl ? <img src={activeProfile.avatarUrl} alt={activeProfile.fullName} className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,9,12,0.08)_0%,rgba(6,9,12,0.28)_38%,rgba(6,9,12,0.92)_100%)]" />
          <div className="relative flex min-h-[380px] flex-col justify-between p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/72">meu perfil</div>
              <Link href="/settings">
                <Button variant="secondary">Editar perfil</Button>
              </Link>
            </div>

            <div className="space-y-5">
              <div className="flex items-end gap-4">
                {activeProfile.avatarUrl ? (
                  <img src={activeProfile.avatarUrl} alt={activeProfile.fullName} className="size-24 rounded-[26px] border border-white/10 object-cover" />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-[26px] border border-white/10 bg-white/10 text-3xl font-semibold">
                    {sessionUser?.avatar ?? "PS"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">{activeProfile.username}</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-[-0.08em]">{activeProfile.fullName}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/74">{activeProfile.bio || "Seu perfil social esta pronto para acompanhar evolucao e conexoes."}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/58">
                    {activeProfile.city}, {activeProfile.country} · {activeProfile.fitnessGoal}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled>Mensagem futura</Button>
                <Button variant="secondary" disabled>
                  Seguir futura expansao
                </Button>
              </div>
            </div>
          </div>
        </div>
      </StrongSurface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">peso atual</p>
          <p className="metric-number mt-2 text-3xl">{stats?.currentWeightKg ?? activeProfile.weightKg} kg</p>
        </Surface>
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">evolucao</p>
          <p className="metric-number mt-2 text-3xl">{stats?.evolutionKg ?? 0} kg</p>
        </Surface>
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">dias treinados</p>
          <p className="metric-number mt-2 text-3xl">{stats?.trainedDays ?? 0}</p>
        </Surface>
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">sequencia</p>
          <p className="metric-number mt-2 text-3xl">{Math.max(stats?.currentStreak ?? 0, localStreak)}</p>
        </Surface>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Surface className="rounded-[24px]">
          <SectionHeading eyebrow="resumo" title="Volume e favoritos" />
          <div className="mt-4 space-y-3">
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">exercicios favoritos</p>
              <p className="mt-2 text-sm text-white/78">{stats?.favoriteExercises.join(" · ") || "Marque favoritos na aba de treinos para aparecer aqui."}</p>
            </div>
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">carga maxima</p>
              <p className="metric-number mt-2 text-3xl">{stats?.maxLoadKg ?? 0} kg</p>
            </div>
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">tempo treinando</p>
              <p className="metric-number mt-2 text-3xl">{Math.max(stats?.trainingMinutes ?? 0, localMinutes)} min</p>
            </div>
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">posts e amigos</p>
              <p className="mt-2 text-sm text-white/78">
                {stats?.postsCount ?? (socialReady ? posts.length : localFeedPosts.length)} posts · {stats?.friendsCount ?? 0} amigos
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="rounded-[24px]">
          <SectionHeading eyebrow="progresso visual" title="Fotos recentes" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recentPhotos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-[18px] bg-white/4">
                <img src={photo.image} alt={photo.label} className="h-44 w-full object-cover" />
                <div className="p-3">
                  <p className="text-sm font-medium">{photo.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{photo.note}</p>
                </div>
              </div>
            ))}
            {recentPhotos.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-white/8 p-4 text-sm text-[var(--muted)]">
                Suas fotos de progresso vao aparecer aqui assim que forem adicionadas.
              </div>
            ) : null}
          </div>
        </Surface>
      </div>

      <SectionHeading eyebrow="posts" title="Meu feed publico" />
      <div className="space-y-5">
        {socialReady
          ? posts.map((post) => (
              <SocialPostCard key={post.id} post={post} liked={false} canInteract={Boolean(activeProfile.verifiedEmail)} viewerProfile={activeProfile} />
            ))
          : localFeedPosts.map((post) => (
              <Surface key={post.id} className="overflow-hidden rounded-[24px] p-0">
                <img src={post.image} alt={post.caption} className="h-72 w-full object-cover" />
                <div className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{post.activityLabel}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{post.caption}</h3>
                  {post.type === "run" ? (
                    <RunPostMetrics
                      runTime={post.runTime}
                      runDistance={post.runDistance ?? (post.runKm ? `${post.runKm} km` : undefined)}
                      runPace={post.runPace}
                    />
                  ) : null}
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {post.likes} curtidas · {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Surface>
            ))}
        {(socialReady ? posts.length === 0 : localFeedPosts.length === 0) ? (
          <Surface className="rounded-[22px] p-5 text-sm text-[var(--muted)]">
            Voce ainda nao publicou nenhum treino, corrida, evolucao ou conquista no feed social.
          </Surface>
        ) : null}
      </div>
    </PageFrame>
  );
}
