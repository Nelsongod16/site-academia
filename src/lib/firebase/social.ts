import { compressImage } from "@/lib/media";
import { getSupabaseClient } from "@/lib/firebase/client";
import {
  buildBlockId,
  buildFriendRequestId,
  buildFriendshipKey,
  buildSearchIndex,
  formatUsername,
  normalizeSearchText,
  normalizeUsername,
} from "@/lib/social-utils";
import { isoNow } from "@/lib/utils";
import type {
  FriendRequest,
  Friendship,
  ReportTargetType,
  SocialComment,
  SocialNotification,
  SocialPost,
  SocialProfile,
  SocialProfileInput,
  SocialStats,
  UserBlock,
} from "@/types/social";

const TABLES = {
  profiles: "profiles",
  snapshots: "user_snapshots",
  posts: "posts",
  comments: "comments",
  likes: "likes",
  friendRequests: "friend_requests",
  friendships: "friendships",
  blocks: "blocks",
  notifications: "notifications",
  stats: "user_stats",
  reports: "reports",
} as const;

function requireServices() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  return supabase;
}

function sortByDateDesc<T extends { createdAt?: string; updatedAt?: string; lastActiveAt?: string }>(records: T[]) {
  return [...records].sort((left, right) => {
    const leftValue = left.createdAt ?? left.updatedAt ?? left.lastActiveAt ?? "";
    const rightValue = right.createdAt ?? right.updatedAt ?? right.lastActiveAt ?? "";
    return leftValue < rightValue ? 1 : -1;
  });
}

function mapProfileRow(row: Record<string, unknown>): SocialProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    fullName: String(row.full_name ?? ""),
    username: String(row.username ?? ""),
    usernameKey: String(row.username_key ?? ""),
    avatarUrl: String(row.avatar_url ?? ""),
    bio: String(row.bio ?? ""),
    city: String(row.city ?? ""),
    country: String(row.country ?? ""),
    fitnessGoal: String(row.fitness_goal ?? ""),
    trainingStyles: Array.isArray(row.training_styles) ? row.training_styles.map(String) : [],
    age: Number(row.age ?? 0),
    birthDate: String(row.birth_date ?? ""),
    weightKg: Number(row.weight_kg ?? 0),
    heightCm: Number(row.height_cm ?? 0),
    sex: (row.sex as SocialProfile["sex"]) ?? "nao-informar",
    visibility: (row.visibility as SocialProfile["visibility"]) ?? "public",
    verifiedEmail: Boolean(row.verified_email),
    profileCompleted: Boolean(row.profile_completed),
    accountStatus: (row.account_status as SocialProfile["accountStatus"]) ?? "active",
    moderationState: (row.moderation_state as SocialProfile["moderationState"]) ?? "clean",
    createdAt: String(row.created_at ?? isoNow()),
    updatedAt: String(row.updated_at ?? isoNow()),
    lastActiveAt: String(row.last_active_at ?? isoNow()),
    searchIndex: Array.isArray(row.search_index) ? row.search_index.map(String) : [],
  };
}

function mapStatsRow(row: Record<string, unknown>): SocialStats {
  return {
    userId: String(row.user_id),
    currentWeightKg: Number(row.current_weight_kg ?? 0),
    evolutionKg: Number(row.evolution_kg ?? 0),
    trainedDays: Number(row.trained_days ?? 0),
    currentStreak: Number(row.current_streak ?? 0),
    favoriteExercises: Array.isArray(row.favorite_exercises) ? row.favorite_exercises.map(String) : [],
    maxLoadKg: Number(row.max_load_kg ?? 0),
    trainingMinutes: Number(row.training_minutes ?? 0),
    postsCount: Number(row.posts_count ?? 0),
    friendsCount: Number(row.friends_count ?? 0),
    followersCount: Number(row.followers_count ?? 0),
    trainingSinceDays: Number(row.training_since_days ?? 0),
    updatedAt: String(row.updated_at ?? isoNow()),
  };
}

function mapPostRow(row: Record<string, unknown>): SocialPost {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    authorName: String(row.author_name ?? ""),
    authorUsername: String(row.author_username ?? ""),
    authorAvatarUrl: String(row.author_avatar_url ?? ""),
    caption: String(row.caption ?? ""),
    imageUrl: String(row.image_url ?? ""),
    postType: (row.post_type as SocialPost["postType"]) ?? "workout",
    location: row.location ? String(row.location) : undefined,
    visibility: (row.visibility as SocialPost["visibility"]) ?? "public",
    likesCount: Number(row.likes_count ?? 0),
    commentsCount: Number(row.comments_count ?? 0),
    moderationState: (row.moderation_state as SocialPost["moderationState"]) ?? "clean",
    createdAt: String(row.created_at ?? isoNow()),
  };
}

function mapCommentRow(row: Record<string, unknown>): SocialComment {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    userId: String(row.user_id),
    authorName: String(row.author_name ?? ""),
    authorUsername: String(row.author_username ?? ""),
    authorAvatarUrl: String(row.author_avatar_url ?? ""),
    text: String(row.text ?? ""),
    moderationState: (row.moderation_state as SocialComment["moderationState"]) ?? "clean",
    createdAt: String(row.created_at ?? isoNow()),
  };
}

function mapFriendRequestRow(row: Record<string, unknown>): FriendRequest {
  return {
    id: String(row.id),
    fromUserId: String(row.from_user_id),
    toUserId: String(row.to_user_id),
    status: (row.status as FriendRequest["status"]) ?? "pending",
    createdAt: String(row.created_at ?? isoNow()),
    updatedAt: String(row.updated_at ?? isoNow()),
  };
}

function mapFriendshipRow(row: Record<string, unknown>): Friendship {
  return {
    id: String(row.id),
    pairKey: String(row.pair_key),
    users: [String((row.users as string[])[0]), String((row.users as string[])[1])],
    createdAt: String(row.created_at ?? isoNow()),
  };
}

function mapBlockRow(row: Record<string, unknown>): UserBlock {
  return {
    id: String(row.id),
    blockerId: String(row.blocker_id),
    blockedId: String(row.blocked_id),
    createdAt: String(row.created_at ?? isoNow()),
  };
}

function mapNotificationRow(row: Record<string, unknown>): SocialNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    actorUserId: String(row.actor_user_id),
    type: (row.type as SocialNotification["type"]) ?? "mention",
    postId: row.post_id ? String(row.post_id) : undefined,
    commentId: row.comment_id ? String(row.comment_id) : undefined,
    message: String(row.message ?? ""),
    read: Boolean(row.read),
    createdAt: String(row.created_at ?? isoNow()),
  };
}

function subscribeWithRefetch(channelName: string, table: string, refetch: () => Promise<void>, filter?: string) {
  const supabase = requireServices();
  void refetch();

  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table, filter }, () => {
      void refetch();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeCurrentUserProfile(userId: string, callback: (profile: SocialProfile | null) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(
    `profile-${userId}`,
    TABLES.profiles,
    async () => {
      const { data } = await supabase.from(TABLES.profiles).select("*").eq("id", userId).maybeSingle();
      callback(data ? mapProfileRow(data as Record<string, unknown>) : null);
    },
    `id=eq.${userId}`,
  );
}

export function subscribeUserStats(userId: string, callback: (stats: SocialStats | null) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(
    `stats-${userId}`,
    TABLES.stats,
    async () => {
      const { data } = await supabase.from(TABLES.stats).select("*").eq("user_id", userId).maybeSingle();
      callback(data ? mapStatsRow(data as Record<string, unknown>) : null);
    },
    `user_id=eq.${userId}`,
  );
}

export function subscribeAllProfiles(callback: (profiles: SocialProfile[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(`profiles-all`, TABLES.profiles, async () => {
    const { data } = await supabase.from(TABLES.profiles).select("*").limit(120);
    callback(sortByDateDesc((data ?? []).map((item) => mapProfileRow(item as Record<string, unknown>))));
  });
}

export function subscribeAllStats(callback: (statsMap: Record<string, SocialStats>) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(`stats-all`, TABLES.stats, async () => {
    const { data } = await supabase.from(TABLES.stats).select("*").limit(120);
    callback(
      (data ?? []).reduce<Record<string, SocialStats>>((accumulator, item) => {
        const stats = mapStatsRow(item as Record<string, unknown>);
        accumulator[stats.userId] = stats;
        return accumulator;
      }, {}),
    );
  });
}

export function subscribeFeedPosts(callback: (posts: SocialPost[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(`posts-feed`, TABLES.posts, async () => {
    const { data } = await supabase.from(TABLES.posts).select("*").order("created_at", { ascending: false }).limit(80);
    callback((data ?? []).map((item) => mapPostRow(item as Record<string, unknown>)));
  });
}

export function subscribePostsByUser(userId: string, callback: (posts: SocialPost[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(
    `posts-${userId}`,
    TABLES.posts,
    async () => {
      const { data } = await supabase.from(TABLES.posts).select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(80);
      callback((data ?? []).map((item) => mapPostRow(item as Record<string, unknown>)));
    },
    `user_id=eq.${userId}`,
  );
}

export function subscribePostComments(postId: string, callback: (comments: SocialComment[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(
    `comments-${postId}`,
    TABLES.comments,
    async () => {
      const { data } = await supabase.from(TABLES.comments).select("*").eq("post_id", postId).order("created_at", { ascending: false }).limit(150);
      callback((data ?? []).map((item) => mapCommentRow(item as Record<string, unknown>)));
    },
    `post_id=eq.${postId}`,
  );
}

export function subscribeUserLikes(userId: string, callback: (likedPostIds: string[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(
    `likes-${userId}`,
    TABLES.likes,
    async () => {
      const { data } = await supabase.from(TABLES.likes).select("post_id").eq("user_id", userId);
      callback((data ?? []).map((item) => String((item as { post_id: string }).post_id)));
    },
    `user_id=eq.${userId}`,
  );
}

export function subscribeFriendRequests(userId: string, callback: (requests: FriendRequest[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(`friend-requests-${userId}`, TABLES.friendRequests, async () => {
    const { data } = await supabase.from(TABLES.friendRequests).select("*").limit(200);
    const requests = (data ?? [])
      .map((item) => mapFriendRequestRow(item as Record<string, unknown>))
      .filter((request) => request.fromUserId === userId || request.toUserId === userId);
    callback(sortByDateDesc(requests));
  });
}

export function subscribeFriendships(userId: string, callback: (friendships: Friendship[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(`friendships-${userId}`, TABLES.friendships, async () => {
    const { data } = await supabase.from(TABLES.friendships).select("*").limit(200);
    callback(
      (data ?? [])
        .map((item) => mapFriendshipRow(item as Record<string, unknown>))
        .filter((friendship) => friendship.users.includes(userId)),
    );
  });
}

export function subscribeBlocks(userId: string, callback: (blocks: UserBlock[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(`blocks-${userId}`, TABLES.blocks, async () => {
    const { data } = await supabase.from(TABLES.blocks).select("*").limit(200);
    callback(
      (data ?? [])
        .map((item) => mapBlockRow(item as Record<string, unknown>))
        .filter((block) => block.blockerId === userId || block.blockedId === userId),
    );
  });
}

export function subscribeNotifications(userId: string, callback: (notifications: SocialNotification[]) => void) {
  const supabase = requireServices();
  return subscribeWithRefetch(`notifications-${userId}`, TABLES.notifications, async () => {
    const { data } = await supabase.from(TABLES.notifications).select("*").eq("user_id", userId).limit(200);
    callback(sortByDateDesc((data ?? []).map((item) => mapNotificationRow(item as Record<string, unknown>))));
  });
}

export async function getUserIdByUsername(username: string) {
  const supabase = requireServices();
  const { data } = await supabase.from(TABLES.profiles).select("id").eq("username_key", normalizeUsername(username)).maybeSingle();
  return data ? String((data as { id: string }).id) : null;
}

export async function getProfileByUsername(username: string) {
  const supabase = requireServices();
  const { data } = await supabase.from(TABLES.profiles).select("*").eq("username_key", normalizeUsername(username)).maybeSingle();
  return data ? mapProfileRow(data as Record<string, unknown>) : null;
}

async function uploadCompressedFile(userId: string, path: string, file: File) {
  const supabase = requireServices();
  const dataUrl = file.type.startsWith("image/") ? await compressImage(file) : await fileToDataUrl(file);
  const blob = await (await fetch(dataUrl)).blob();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    upsert: true,
    contentType: blob.type || file.type,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export async function uploadProfileImage(userId: string, file: File) {
  const extension = file.name.split(".").pop() || "jpg";
  return uploadCompressedFile(userId, `profiles/${userId}/avatar-${Date.now()}.${extension}`, file);
}

export async function uploadPostImage(userId: string, postId: string, file: File) {
  const extension = file.name.split(".").pop() || "jpg";
  return uploadCompressedFile(userId, `posts/${userId}/${postId}.${extension}`, file);
}

export async function upsertProfile(args: {
  userId: string;
  email: string;
  emailVerified: boolean;
  input: SocialProfileInput;
}) {
  const supabase = requireServices();
  const now = isoNow();
  const usernameKey = normalizeUsername(args.input.username);
  const { data: existing } = await supabase
    .from(TABLES.profiles)
    .select("id")
    .eq("username_key", usernameKey)
    .neq("id", args.userId)
    .maybeSingle();

  if (existing) {
    throw new Error("Esse @username ja esta em uso.");
  }

  const payload = {
    id: args.userId,
    email: args.email,
    full_name: args.input.fullName.trim(),
    username: formatUsername(args.input.username),
    username_key: usernameKey,
    avatar_url: args.input.avatarUrl,
    bio: args.input.bio.trim(),
    city: args.input.city.trim(),
    country: args.input.country.trim(),
    fitness_goal: args.input.fitnessGoal.trim(),
    training_styles: args.input.trainingStyles,
    age: args.input.age,
    birth_date: args.input.birthDate,
    weight_kg: args.input.weightKg,
    height_cm: args.input.heightCm,
    sex: args.input.sex,
    visibility: args.input.visibility,
    verified_email: args.emailVerified,
    profile_completed: true,
    account_status: "active",
    moderation_state: "clean",
    last_active_at: now,
    updated_at: now,
    created_at: now,
    search_index: buildSearchIndex(args.input),
  };

  const { error } = await supabase.from(TABLES.profiles).upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from(TABLES.stats).upsert(
    {
      user_id: args.userId,
      current_weight_kg: args.input.weightKg,
      evolution_kg: 0,
      trained_days: 0,
      current_streak: 0,
      favorite_exercises: [],
      max_load_kg: 0,
      training_minutes: 0,
      posts_count: 0,
      friends_count: 0,
      followers_count: 0,
      training_since_days: 0,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
}

export async function refreshUserVerification(userId: string, emailVerified: boolean) {
  const supabase = requireServices();
  const { error } = await supabase
    .from(TABLES.profiles)
    .update({
      verified_email: emailVerified,
      last_active_at: isoNow(),
      updated_at: isoNow(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function touchUserPresence(userId: string) {
  const supabase = requireServices();
  const { error } = await supabase.from(TABLES.profiles).update({ last_active_at: isoNow(), updated_at: isoNow() }).eq("id", userId);

  if (error && !error.message.toLowerCase().includes("no rows")) {
    throw new Error(error.message);
  }
}

export async function upsertUserStats(userId: string, patch: Omit<SocialStats, "updatedAt" | "userId">) {
  const supabase = requireServices();
  const { error } = await supabase.from(TABLES.stats).upsert(
    {
      user_id: userId,
      current_weight_kg: patch.currentWeightKg,
      evolution_kg: patch.evolutionKg,
      trained_days: patch.trainedDays,
      current_streak: patch.currentStreak,
      favorite_exercises: patch.favoriteExercises,
      max_load_kg: patch.maxLoadKg,
      training_minutes: patch.trainingMinutes,
      posts_count: patch.postsCount,
      friends_count: patch.friendsCount,
      followers_count: patch.followersCount,
      training_since_days: patch.trainingSinceDays,
      updated_at: isoNow(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function createSocialPost(args: {
  postId?: string;
  userId: string;
  caption: string;
  imageUrl: string;
  postType: SocialPost["postType"];
  location?: string;
  visibility: SocialPost["visibility"];
}) {
  const supabase = requireServices();
  const { data: profileData } = await supabase.from(TABLES.profiles).select("*").eq("id", args.userId).maybeSingle();

  if (!profileData) {
    throw new Error("Complete seu perfil antes de postar.");
  }

  const profile = mapProfileRow(profileData as Record<string, unknown>);

  const postId = args.postId ?? crypto.randomUUID();
  const { error } = await supabase.from(TABLES.posts).insert({
    id: postId,
    user_id: args.userId,
    author_name: profile.fullName,
    author_username: profile.username,
    author_avatar_url: profile.avatarUrl,
    caption: args.caption.trim(),
    image_url: args.imageUrl,
    post_type: args.postType,
    location: args.location?.trim() || null,
    visibility: args.visibility,
    likes_count: 0,
    comments_count: 0,
    moderation_state: "clean",
    created_at: isoNow(),
  });

  if (error) {
    throw new Error(error.message);
  }

  return postId;
}

async function createNotification(args: Omit<SocialNotification, "id" | "createdAt" | "read">) {
  const supabase = requireServices();
  await supabase.from(TABLES.notifications).insert({
    id: crypto.randomUUID(),
    user_id: args.userId,
    actor_user_id: args.actorUserId,
    type: args.type,
    post_id: args.postId ?? null,
    comment_id: args.commentId ?? null,
    message: args.message,
    read: false,
    created_at: isoNow(),
  });
}

export async function togglePostLike(postId: string, userId: string) {
  const supabase = requireServices();
  const likeId = `${postId}__${userId}`;
  const { data: existing } = await supabase.from(TABLES.likes).select("id").eq("id", likeId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from(TABLES.likes).delete().eq("id", likeId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const [{ data: postData }, { data: actorData }] = await Promise.all([
    supabase.from(TABLES.posts).select("user_id").eq("id", postId).maybeSingle(),
    supabase.from(TABLES.profiles).select("full_name").eq("id", userId).maybeSingle(),
  ]);

  const { error } = await supabase.from(TABLES.likes).insert({
    id: likeId,
    post_id: postId,
    user_id: userId,
    created_at: isoNow(),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (postData && (postData as { user_id: string }).user_id !== userId) {
    await createNotification({
      userId: (postData as { user_id: string }).user_id,
      actorUserId: userId,
      type: "like",
      postId,
      message: `${String((actorData as { full_name?: string } | null)?.full_name ?? "Alguem")} curtiu seu post.`,
    });
  }
}

export async function addPostComment(args: { postId: string; userId: string; text: string }) {
  const supabase = requireServices();
  const [{ data: postData }, { data: actorData }] = await Promise.all([
    supabase.from(TABLES.posts).select("user_id").eq("id", args.postId).maybeSingle(),
    supabase.from(TABLES.profiles).select("*").eq("id", args.userId).maybeSingle(),
  ]);

  if (!actorData) {
    throw new Error("Nao foi possivel comentar agora.");
  }

  const actor = mapProfileRow(actorData as Record<string, unknown>);
  const commentId = crypto.randomUUID();
  const { error } = await supabase.from(TABLES.comments).insert({
    id: commentId,
    post_id: args.postId,
    user_id: args.userId,
    author_name: actor.fullName,
    author_username: actor.username,
    author_avatar_url: actor.avatarUrl,
    text: args.text.trim(),
    moderation_state: "clean",
    created_at: isoNow(),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (postData && (postData as { user_id: string }).user_id !== args.userId) {
    await createNotification({
      userId: (postData as { user_id: string }).user_id,
      actorUserId: args.userId,
      type: "comment",
      postId: args.postId,
      commentId,
      message: `${actor.fullName} comentou no seu post.`,
    });
  }
}

export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  if (fromUserId === toUserId) {
    return;
  }

  const supabase = requireServices();
  const requestId = buildFriendRequestId(fromUserId, toUserId);
  const inverseRequestId = buildFriendRequestId(toUserId, fromUserId);
  const friendshipId = buildFriendshipKey(fromUserId, toUserId);

  const [{ data: existing }, { data: inverse }, { data: friendship }, { data: actorData }] = await Promise.all([
    supabase.from(TABLES.friendRequests).select("*").eq("id", requestId).maybeSingle(),
    supabase.from(TABLES.friendRequests).select("*").eq("id", inverseRequestId).maybeSingle(),
    supabase.from(TABLES.friendships).select("*").eq("id", friendshipId).maybeSingle(),
    supabase.from(TABLES.profiles).select("full_name").eq("id", fromUserId).maybeSingle(),
  ]);

  if (friendship) {
    return;
  }

  if (inverse && (inverse as { status?: string }).status === "pending") {
    await acceptFriendRequest(String((inverse as { id: string }).id), fromUserId);
    return;
  }

  if (existing && (existing as { status?: string }).status === "pending") {
    return;
  }

  const { error } = await supabase.from(TABLES.friendRequests).upsert({
    id: requestId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: "pending",
    created_at: isoNow(),
    updated_at: isoNow(),
  });

  if (error) {
    throw new Error(error.message);
  }

  await createNotification({
    userId: toUserId,
    actorUserId: fromUserId,
    type: "friend_request",
    message: `${String((actorData as { full_name?: string } | null)?.full_name ?? "Alguem")} enviou um pedido de amizade.`,
  });
}

export async function acceptFriendRequest(requestId: string, currentUserId: string) {
  const supabase = requireServices();
  const { data: requestData } = await supabase.from(TABLES.friendRequests).select("*").eq("id", requestId).maybeSingle();

  if (!requestData) {
    return;
  }

  const request = mapFriendRequestRow(requestData as Record<string, unknown>);
  const friendshipId = buildFriendshipKey(request.fromUserId, request.toUserId);
  const { error: friendshipError } = await supabase.from(TABLES.friendships).upsert({
    id: friendshipId,
    pair_key: friendshipId,
    users: [request.fromUserId, request.toUserId].sort(),
    created_at: isoNow(),
  });

  if (friendshipError) {
    throw new Error(friendshipError.message);
  }

  await supabase.from(TABLES.friendRequests).update({ status: "accepted", updated_at: isoNow() }).eq("id", requestId);
  const { data: actorData } = await supabase.from(TABLES.profiles).select("full_name").eq("id", currentUserId).maybeSingle();

  await createNotification({
    userId: request.fromUserId,
    actorUserId: currentUserId,
    type: "friend_accept",
    message: `${String((actorData as { full_name?: string } | null)?.full_name ?? "Alguem")} aceitou seu pedido de amizade.`,
  });
}

export async function rejectFriendRequest(requestId: string) {
  const supabase = requireServices();
  await supabase.from(TABLES.friendRequests).update({ status: "rejected", updated_at: isoNow() }).eq("id", requestId);
}

export async function cancelFriendRequest(fromUserId: string, toUserId: string) {
  const supabase = requireServices();
  await supabase.from(TABLES.friendRequests).update({ status: "cancelled", updated_at: isoNow() }).eq("id", buildFriendRequestId(fromUserId, toUserId));
}

export async function removeFriend(userId: string, targetUserId: string) {
  const supabase = requireServices();
  await supabase.from(TABLES.friendships).delete().eq("id", buildFriendshipKey(userId, targetUserId));
}

export async function blockUser(userId: string, targetUserId: string) {
  const supabase = requireServices();
  await supabase.from(TABLES.blocks).upsert({
    id: buildBlockId(userId, targetUserId),
    blocker_id: userId,
    blocked_id: targetUserId,
    created_at: isoNow(),
  });
  await removeFriend(userId, targetUserId).catch(() => undefined);
}

export async function reportEntity(args: {
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}) {
  const supabase = requireServices();
  await supabase.from(TABLES.reports).insert({
    id: crypto.randomUUID(),
    reporter_user_id: args.reporterUserId,
    target_type: args.targetType,
    target_id: args.targetId,
    reason: args.reason,
    details: args.details ?? "",
    status: "open",
    created_at: isoNow(),
  });
}

export async function markNotificationRead(notificationId: string) {
  const supabase = requireServices();
  await supabase.from(TABLES.notifications).update({ read: true }).eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = requireServices();
  await supabase.from(TABLES.notifications).update({ read: true }).eq("user_id", userId).eq("read", false);
}

export function filterProfilesForSearch(profiles: SocialProfile[], queryText: string) {
  const normalized = normalizeSearchText(queryText);
  if (!normalized) {
    return [];
  }

  return profiles.filter((profile) => {
    if (profile.accountStatus !== "active" || !profile.profileCompleted) {
      return false;
    }

    return (
      profile.searchIndex.includes(normalized) ||
      normalizeSearchText(profile.fullName).includes(normalized) ||
      normalizeSearchText(profile.username).includes(normalized) ||
      normalizeSearchText(profile.city).includes(normalized) ||
      normalizeSearchText(profile.country).includes(normalized)
    );
  });
}
