"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";

import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileOnboardingModal } from "@/components/social/profile-onboarding-modal";
import { TopBar } from "@/components/layout/top-bar";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useCurrentSocialState, useFirebaseSessionSync, useProfilePosts } from "@/hooks/use-social-session";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { upsertUserStats } from "@/lib/firebase/social";
import { computeStatsFromTraining } from "@/lib/social-utils";
import { useAppStore } from "@/store/app-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const hasHydrated = useStore(useAppStore, (state) => state.hasHydrated);
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const updateSessionUser = useStore(useAppStore, (state) => state.updateSessionUser);
  const workouts = useStore(useAppStore, (state) => state.workouts);
  const runs = useStore(useAppStore, (state) => state.runs);
  const exercises = useStore(useAppStore, (state) => state.exercises);
  const favoriteExerciseIds = useStore(useAppStore, (state) => state.favoriteExerciseIds);
  const { profile, friendships, stats } = useCurrentSocialState();
  const profilePosts = useProfilePosts(profile?.id);

  useFirebaseSessionSync();
  useRealtimeSync();

  useEffect(() => {
    if (hasHydrated && !sessionUser) {
      router.replace("/");
    }
  }, [hasHydrated, router, sessionUser]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    updateSessionUser({
      name: profile.fullName,
      avatarImage: profile.avatarUrl,
      avatar: profile.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      username: profile.username,
      bio: profile.bio,
      emailVerified: profile.verifiedEmail,
      profileCompleted: profile.profileCompleted,
    });
  }, [profile, updateSessionUser]);

  useEffect(() => {
    if (!sessionUser || sessionUser.mode !== "firebase" || !profile || !hasFirebaseConfig()) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextStats = computeStatsFromTraining({
        userId: sessionUser.id,
        workouts,
        runs,
        exercises,
        favoriteExerciseIds,
        postCount: profilePosts.length,
        friendCount: friendships.length,
        currentWeightKg: profile.weightKg,
        previousWeightKg: stats?.currentWeightKg,
      });

      const { userId: _userId, ...statsPatch } = nextStats;
      void upsertUserStats(sessionUser.id, statsPatch);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [sessionUser, profile, workouts, runs, exercises, favoriteExerciseIds, profilePosts.length, friendships.length, stats?.currentWeightKg]);

  if (!hasHydrated) {
    return null;
  }

  if (!sessionUser && currentPath !== "/" && currentPath !== "/register") {
    return null;
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-5">
        <TopBar />
        <main className="mt-3">{children}</main>
      </div>
      <BottomNav />
      <ProfileOnboardingModal
        key={`mandatory-${sessionUser?.id ?? "guest"}-${profile?.updatedAt ?? "new"}`}
        open={Boolean(sessionUser && sessionUser.mode === "firebase" && hasFirebaseConfig() && !profile?.profileCompleted)}
        mandatory
        profile={profile}
      />
    </div>
  );
}
