"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useStore } from "zustand";

import { refreshUserVerification, subscribeAllProfiles, subscribeAllStats, subscribeBlocks, subscribeCurrentUserProfile, subscribeFeedPosts, subscribeFriendRequests, subscribeFriendships, subscribeNotifications, subscribePostsByUser, subscribeUserLikes, subscribeUserStats, touchUserPresence } from "@/lib/firebase/social";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { watchFirebaseAuth } from "@/lib/firebase/auth";
import { useAppStore } from "@/store/app-store";
import type { SocialNotification, SocialPost, SocialProfile, SocialStats, FriendRequest, Friendship, UserBlock } from "@/types/social";

export function useFirebaseSessionSync() {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const signInFirebaseUser = useStore(useAppStore, (state) => state.signInFirebaseUser);
  const updateSessionUser = useStore(useAppStore, (state) => state.updateSessionUser);
  const signOut = useStore(useAppStore, (state) => state.signOut);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      return;
    }

    return watchFirebaseAuth((user) => {
      if (!user) {
        signOut();
        return;
      }

      signInFirebaseUser({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });
    });
  }, [signInFirebaseUser, signOut]);

  const syncPresence = useEffectEvent(async () => {
    if (!sessionUser || sessionUser.mode !== "firebase") {
      return;
    }

    await touchUserPresence(sessionUser.id).catch(() => undefined);
    if (typeof sessionUser.emailVerified === "boolean") {
      await refreshUserVerification(sessionUser.id, sessionUser.emailVerified).catch(() => undefined);
    }
  });

  useEffect(() => {
    if (!sessionUser || sessionUser.mode !== "firebase") {
      return;
    }

    void syncPresence();
    const timer = window.setInterval(() => {
      void syncPresence();
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [sessionUser]);

  useEffect(() => {
    if (!sessionUser?.emailVerified || sessionUser.mode !== "firebase") {
      return;
    }

    updateSessionUser({ emailVerified: true });
  }, [sessionUser?.emailVerified, sessionUser?.mode, updateSessionUser]);
}

export function useCurrentSocialState() {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const socialEnabled = hasFirebaseConfig() && Boolean(sessionUser && sessionUser.mode === "firebase");
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);

  useEffect(() => {
    if (!socialEnabled || !sessionUser) {
      return;
    }

    const unsubs = [
      subscribeCurrentUserProfile(sessionUser.id, setProfile),
      subscribeUserStats(sessionUser.id, setStats),
      subscribeFriendRequests(sessionUser.id, setFriendRequests),
      subscribeFriendships(sessionUser.id, setFriendships),
      subscribeBlocks(sessionUser.id, setBlocks),
      subscribeNotifications(sessionUser.id, setNotifications),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessionUser, socialEnabled]);

  const safeProfile = socialEnabled && profile?.id === sessionUser?.id ? profile : null;
  const safeStats = socialEnabled && stats?.userId === sessionUser?.id ? stats : null;
  const safeFriendRequests = socialEnabled ? friendRequests : [];
  const safeFriendships = socialEnabled ? friendships : [];
  const safeBlocks = socialEnabled ? blocks : [];
  const safeNotifications = socialEnabled ? notifications : [];
  const unreadNotifications = useMemo(
    () => (socialEnabled ? notifications.filter((notification) => !notification.read).length : 0),
    [notifications, socialEnabled],
  );

  return {
    sessionUser,
    profile: safeProfile,
    stats: safeStats,
    friendRequests: safeFriendRequests,
    friendships: safeFriendships,
    blocks: safeBlocks,
    notifications: safeNotifications,
    unreadNotifications,
  };
}

export function useSocialDirectory() {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [statsByUserId, setStatsByUserId] = useState<Record<string, SocialStats>>({});
  const socialEnabled = hasFirebaseConfig();

  useEffect(() => {
    if (!socialEnabled) {
      return;
    }

    const unsubs = [subscribeAllProfiles(setProfiles), subscribeAllStats(setStatsByUserId)];
    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [socialEnabled]);

  return { profiles: socialEnabled ? profiles : [], statsByUserId: socialEnabled ? statsByUserId : {} };
}

export function useSocialFeed() {
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const socialEnabled = hasFirebaseConfig();
  const likesEnabled = socialEnabled && Boolean(sessionUser && sessionUser.mode === "firebase");

  useEffect(() => {
    if (!socialEnabled) {
      return;
    }

    return subscribeFeedPosts(setPosts);
  }, [socialEnabled]);

  useEffect(() => {
    if (!likesEnabled || !sessionUser) {
      return;
    }

    return subscribeUserLikes(sessionUser.id, setLikedPostIds);
  }, [likesEnabled, sessionUser]);

  return { posts: socialEnabled ? posts : [], likedPostIds: likesEnabled ? likedPostIds : [] };
}

export function useProfilePosts(userId?: string | null) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const enabled = hasFirebaseConfig() && Boolean(userId);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    return subscribePostsByUser(userId, setPosts);
  }, [enabled, userId]);

  return enabled ? posts : [];
}
