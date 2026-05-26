"use client";

import { useMemo } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { currentStreak, monthlyRunDistance, totalMinutes } from "@/lib/stats";
import { formatDuration } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export function ProfileScreen() {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const runs = useStore(useAppStore, (state) => state.runs);
  const photos = useStore(useAppStore, (state) => state.photos);
  const profiles = useStore(useAppStore, (state) => state.profiles);
  const toggleFollowProfile = useStore(useAppStore, (state) => state.toggleFollowProfile);
  const toggleFriendProfile = useStore(useAppStore, (state) => state.toggleFriendProfile);

  const currentProfile = profiles.find((profile) => profile.id === sessionUser?.id) ?? profiles[0];
  const communityProfiles = profiles.filter((profile) => profile.id !== currentProfile?.id);
  const streak = useMemo(() => currentStreak(workouts), [workouts]);
  const minutes = useMemo(() => totalMinutes(workouts), [workouts]);
  const runKm = useMemo(() => monthlyRunDistance(runs), [runs]);
  const latestWorkout = workouts.find((workout) => workout.completed) ?? workouts[0];
  const recentPhotos = photos.filter((photo) => photo.authorId === currentProfile?.id).slice(0, 2);

  return (
    <PageFrame className="gap-5">
      <StrongSurface className="overflow-hidden rounded-[24px] p-0">
        <div className="relative min-h-[360px]">
          <img src={currentProfile?.coverImage} alt={currentProfile?.name ?? "Perfil"} className="absolute inset-0 h-full w-full object-cover" />
          <div className="cinema-overlay absolute inset-0" />
          <div className="relative flex min-h-[360px] flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/78">
                public profile
              </div>
              <div className="rounded-full bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/68">
                {currentProfile?.city}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-end gap-4">
                <img src={currentProfile?.avatarImage} alt={currentProfile?.name} className="size-20 rounded-[22px] border border-white/10 object-cover" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">{currentProfile?.handle}</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-[-0.08em]">{currentProfile?.name}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/74">{currentProfile?.bio ?? sessionUser?.bio}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-[16px] bg-black/26 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">seguidores</p>
                  <p className="metric-number mt-2 text-xl">{currentProfile?.followers ?? 0}</p>
                </div>
                <div className="rounded-[16px] bg-black/26 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">seguindo</p>
                  <p className="metric-number mt-2 text-xl">{currentProfile?.following ?? 0}</p>
                </div>
                <div className="rounded-[16px] bg-black/26 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">streak</p>
                  <p className="metric-number mt-2 text-xl">{Math.max(streak, currentProfile?.streak ?? 0)}x</p>
                </div>
                <div className="rounded-[16px] bg-black/26 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">corrida mes</p>
                  <p className="metric-number mt-2 text-xl">{runKm.toFixed(1)} km</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StrongSurface>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="highlights" title="Conquistas e ultima sessao" />
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              {currentProfile?.achievements.map((achievement) => (
                <div key={achievement.title} className="rounded-[16px] bg-white/4 px-4 py-3">
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{achievement.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[16px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">ultimo treino</p>
              <p className="mt-2 text-lg font-semibold">{latestWorkout?.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{latestWorkout?.quickNote ?? currentProfile?.lastWorkout}</p>
            </div>

            <div className="rounded-[16px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">frequencia semanal</p>
              <p className="metric-number mt-2 text-2xl">{currentProfile?.weeklyFrequency ?? 0}x</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{formatDuration(minutes)} acumulados no ciclo atual.</p>
            </div>
          </div>
        </Surface>

        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="community" title="Atletas conectados" />
          <div className="mt-4 space-y-3">
            {communityProfiles.map((profile) => (
              <div key={profile.id} className="overflow-hidden rounded-[18px] border border-white/6 bg-white/[0.03]">
                <div className="grid md:grid-cols-[140px_1fr]">
                  <img src={profile.coverImage} alt={profile.name} className="h-full min-h-[164px] w-full object-cover" />
                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={profile.avatarImage} alt={profile.name} className="size-14 rounded-[16px] object-cover" />
                        <div>
                          <p className="text-base font-semibold">{profile.name}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{profile.handle}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant={profile.isFollowing ? "primary" : "secondary"} onClick={() => toggleFollowProfile(profile.id)}>
                          {profile.isFollowing ? "Seguindo" : "Seguir"}
                        </Button>
                        <Button variant={profile.isFriend ? "primary" : "ghost"} onClick={() => toggleFriendProfile(profile.id)}>
                          {profile.isFriend ? "Amigo" : "Adicionar"}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-[var(--muted)]">{profile.bio}</p>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div className="rounded-[14px] bg-white/4 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">streak</p>
                        <p className="metric-number mt-2 text-lg">{profile.streak}x</p>
                      </div>
                      <div className="rounded-[14px] bg-white/4 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">semana</p>
                        <p className="metric-number mt-2 text-lg">{profile.weeklyFrequency}x</p>
                      </div>
                      <div className="rounded-[14px] bg-white/4 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">corridas</p>
                        <p className="metric-number mt-2 text-lg">{profile.totalRuns}</p>
                      </div>
                      <div className="rounded-[14px] bg-white/4 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">seguidores</p>
                        <p className="metric-number mt-2 text-lg">{profile.followers}</p>
                      </div>
                    </div>

                    <div className="rounded-[16px] bg-white/4 p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">ultimo treino</p>
                      <p className="mt-2 text-sm">{profile.lastWorkout}</p>
                      <p className="mt-3 text-xs text-[var(--muted)]">{profile.lastRun}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="visual progress" title="Fotos recentes" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {recentPhotos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-[18px] bg-white/4">
                <img src={photo.image} alt={photo.label} className="h-44 w-full object-cover" />
                <div className="p-3">
                  <p className="text-sm font-medium">{photo.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{photo.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="rounded-[20px]">
          <SectionHeading eyebrow="social summary" title="Volume publico" />
          <div className="mt-4 space-y-3">
            <div className="rounded-[16px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">treinos concluidos</p>
              <p className="metric-number mt-2 text-3xl">{workouts.filter((workout) => workout.completed).length}</p>
            </div>
            <div className="rounded-[16px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">tempo total</p>
              <p className="metric-number mt-2 text-3xl">{formatDuration(minutes)}</p>
            </div>
            <div className="rounded-[16px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">distancia do mes</p>
              <p className="metric-number mt-2 text-3xl">{runKm.toFixed(1)} km</p>
            </div>
          </div>
        </Surface>
      </div>
    </PageFrame>
  );
}
