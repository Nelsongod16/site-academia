"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useStore } from "zustand";

import { ProfileOnboardingModal } from "@/components/social/profile-onboarding-modal";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { subscribeCurrentUserProfile } from "@/lib/firebase/social";
import { useAppStore } from "@/store/app-store";
import type { SocialProfile } from "@/types/social";

function sessionToProfile(
  sessionUser: ReturnType<typeof useAppStore.getState>["sessionUser"],
): SocialProfile | null {
  if (!sessionUser) {
    return null;
  }

  const now = new Date().toISOString();
  const username = sessionUser.username?.replace(/^@/, "") ?? sessionUser.email.split("@")[0] ?? "usuario";

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    fullName: sessionUser.name ?? "",
    username: `@${username}`,
    usernameKey: username.toLowerCase(),
    avatarUrl: sessionUser.avatarImage ?? "",
    bio: sessionUser.bio ?? "",
    city: sessionUser.city ?? "",
    country: sessionUser.country ?? "",
    fitnessGoal: sessionUser.fitnessGoal ?? "consistencia",
    trainingStyles: sessionUser.trainingStyles ?? ["musculacao"],
    age: sessionUser.age ?? 25,
    birthDate: sessionUser.birthDate ?? "",
    weightKg: sessionUser.weightKg ?? 0,
    heightCm: sessionUser.heightCm ?? 0,
    sex: sessionUser.sex ?? "nao-informar",
    visibility: sessionUser.visibility ?? "public",
    verifiedEmail: Boolean(sessionUser.emailVerified ?? true),
    profileCompleted: Boolean(sessionUser.profileCompleted),
    accountStatus: "active",
    moderationState: "clean",
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    searchIndex: [],
  };
}

export function ProfileCompletionGate() {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const updateSessionUser = useStore(useAppStore, (state) => state.updateSessionUser);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [checked, setChecked] = useState(false);

  const fallbackProfile = useMemo(() => sessionToProfile(sessionUser), [sessionUser]);

  useEffect(() => {
    if (!sessionUser) {
      startTransition(() => {
        setProfile(null);
        setChecked(false);
      });
      return;
    }

    if (!hasFirebaseConfig() || sessionUser.mode !== "firebase") {
      startTransition(() => {
        setProfile(fallbackProfile);
        setChecked(true);
      });
      return;
    }

    startTransition(() => {
      setChecked(false);
    });

    return subscribeCurrentUserProfile(sessionUser.id, (nextProfile) => {
      startTransition(() => {
        setProfile(nextProfile);
        setChecked(true);
      });

      if (!nextProfile) {
        return;
      }

      updateSessionUser({
        name: nextProfile.fullName || sessionUser.name,
        avatarImage: nextProfile.avatarUrl || sessionUser.avatarImage,
        bio: nextProfile.bio,
        username: nextProfile.username,
        profileCompleted: nextProfile.profileCompleted,
        city: nextProfile.city,
        country: nextProfile.country,
        fitnessGoal: nextProfile.fitnessGoal,
        trainingStyles: nextProfile.trainingStyles,
        age: nextProfile.age,
        birthDate: nextProfile.birthDate,
        weightKg: nextProfile.weightKg,
        heightCm: nextProfile.heightCm,
        sex: nextProfile.sex,
        visibility: nextProfile.visibility,
      });
    });
  }, [sessionUser?.id, sessionUser?.mode, updateSessionUser]);

  if (!sessionUser) {
    return null;
  }

  const socialProfile = profile ?? fallbackProfile;
  const shouldOpen =
    checked &&
    (sessionUser.mode === "firebase" && hasFirebaseConfig()
      ? !profile?.profileCompleted
      : sessionUser.profileCompleted !== true);

  return <ProfileOnboardingModal open={shouldOpen} mandatory profile={socialProfile} />;
}
