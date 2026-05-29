import type { FriendRequest, Friendship, SocialDiscoveryBuckets, SocialProfile, SocialProfileInput, SocialRelationshipState, SocialStats, UserBlock } from "@/types/social";
import type { Exercise, RunEntry, WorkoutDay } from "@/types/app";

function uniq(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizeUsername(value: string) {
  return normalizeSearchText(value.replace(/^@+/, "").replace(/\s+/g, ""));
}

export function formatUsername(value: string) {
  return `@${normalizeUsername(value)}`;
}

function prefixesForWord(word: string) {
  const values: string[] = [];
  for (let index = 1; index <= word.length; index += 1) {
    values.push(word.slice(0, index));
  }
  return values;
}

export function buildSearchIndex(input: Pick<SocialProfileInput, "fullName" | "username" | "city" | "country" | "fitnessGoal" | "trainingStyles">) {
  const tokens = [
    ...normalizeSearchText(input.fullName).split(/\s+/),
    normalizeUsername(input.username),
    normalizeSearchText(input.city),
    normalizeSearchText(input.country),
    normalizeSearchText(input.fitnessGoal),
    ...input.trainingStyles.map(normalizeSearchText),
  ].filter(Boolean);

  return uniq(tokens.flatMap(prefixesForWord));
}

export function buildFriendshipKey(a: string, b: string) {
  return [a, b].sort().join("__");
}

export function buildFriendRequestId(fromUserId: string, toUserId: string) {
  return `${fromUserId}__${toUserId}`;
}

export function buildBlockId(blockerId: string, blockedId: string) {
  return `${blockerId}__${blockedId}`;
}

export function relationshipForProfile(args: {
  viewerId?: string | null;
  profileId: string;
  friendRequests: FriendRequest[];
  friendships: Friendship[];
  blocks: UserBlock[];
}): SocialRelationshipState {
  const { viewerId, profileId, friendRequests, friendships, blocks } = args;

  if (!viewerId) {
    return {
      isSelf: false,
      isFriend: false,
      outgoingPending: false,
      incomingPending: false,
      blockedByViewer: false,
      blockedViewer: false,
    };
  }

  const outgoingPending = friendRequests.some(
    (request) => request.status === "pending" && request.fromUserId === viewerId && request.toUserId === profileId,
  );
  const incomingPending = friendRequests.some(
    (request) => request.status === "pending" && request.fromUserId === profileId && request.toUserId === viewerId,
  );
  const isFriend = friendships.some((friendship) => friendship.users.includes(viewerId) && friendship.users.includes(profileId));
  const blockedByViewer = blocks.some((block) => block.blockerId === viewerId && block.blockedId === profileId);
  const blockedViewer = blocks.some((block) => block.blockerId === profileId && block.blockedId === viewerId);

  return {
    isSelf: viewerId === profileId,
    isFriend,
    outgoingPending,
    incomingPending,
    blockedByViewer,
    blockedViewer,
  };
}

export function canViewProfile(profile: SocialProfile, relationship: SocialRelationshipState) {
  if (profile.accountStatus !== "active" || !profile.profileCompleted) {
    return false;
  }

  if (relationship.blockedByViewer || relationship.blockedViewer) {
    return false;
  }

  if (profile.visibility === "public") {
    return true;
  }

  if (profile.visibility === "friends") {
    return relationship.isSelf || relationship.isFriend;
  }

  return relationship.isSelf;
}

export function canViewUserContent(profile: SocialProfile, visibility: SocialProfile["visibility"], relationship: SocialRelationshipState) {
  if (!canViewProfile(profile, relationship)) {
    return false;
  }

  if (visibility === "public") {
    return true;
  }

  if (visibility === "friends") {
    return relationship.isSelf || relationship.isFriend;
  }

  return relationship.isSelf;
}

export function buildDiscoveryBuckets(currentProfile: SocialProfile | null, allProfiles: SocialProfile[], statsByUserId: Record<string, SocialStats>) {
  const source = allProfiles.filter((profile) => profile.accountStatus === "active" && profile.profileCompleted);
  const others = currentProfile ? source.filter((profile) => profile.id !== currentProfile.id) : source;

  const rankedByPopularity = [...others].sort((left, right) => (statsByUserId[right.id]?.followersCount ?? 0) - (statsByUserId[left.id]?.followersCount ?? 0));
  const rankedByActivity = [...others].sort((left, right) => (left.lastActiveAt < right.lastActiveAt ? 1 : -1));

  const sameCity = currentProfile
    ? others.filter((profile) => normalizeSearchText(profile.city) === normalizeSearchText(currentProfile.city))
    : [];
  const sameGoal = currentProfile
    ? others.filter((profile) => normalizeSearchText(profile.fitnessGoal) === normalizeSearchText(currentProfile.fitnessGoal))
    : [];
  const sameTrainingStyle = currentProfile
    ? others.filter((profile) =>
        profile.trainingStyles.some((style) =>
          currentProfile.trainingStyles.map(normalizeSearchText).includes(normalizeSearchText(style)),
        ),
      )
    : [];

  const recommended = uniq([
    ...sameGoal.map((profile) => profile.id),
    ...sameTrainingStyle.map((profile) => profile.id),
    ...rankedByActivity.slice(0, 10).map((profile) => profile.id),
  ])
    .map((id) => others.find((profile) => profile.id === id))
    .filter(Boolean) as SocialProfile[];

  return {
    recommended: recommended.slice(0, 8),
    sameCity: sameCity.slice(0, 8),
    sameGoal: sameGoal.slice(0, 8),
    sameTrainingStyle: sameTrainingStyle.slice(0, 8),
    popular: rankedByPopularity.slice(0, 8),
    recentlyActive: rankedByActivity.slice(0, 8),
  } satisfies SocialDiscoveryBuckets;
}

export function computeStatsFromTraining(args: {
  userId: string;
  workouts: WorkoutDay[];
  runs: RunEntry[];
  exercises: Exercise[];
  favoriteExerciseIds: string[];
  postCount: number;
  friendCount: number;
  currentWeightKg: number;
  previousWeightKg?: number;
}) {
  const completedWorkouts = args.workouts.filter((workout) => workout.completed);
  const trainingMinutes = completedWorkouts.reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const trainedDays = completedWorkouts.length + args.runs.length;
  const maxLoadKg = completedWorkouts.reduce((max, workout) => {
    const workoutMax = workout.exercises.reduce((exerciseMax, exercise) => {
      const parsed = Number.parseFloat(exercise.weight.replace(",", "."));
      return Number.isFinite(parsed) ? Math.max(exerciseMax, parsed) : exerciseMax;
    }, 0);

    return Math.max(max, workoutMax);
  }, 0);

  const currentStreak = completedWorkouts.length;
  const favoriteExercises = args.favoriteExerciseIds
    .map((id) => args.exercises.find((exercise) => exercise.id === id)?.name)
    .filter(Boolean) as string[];

  return {
    userId: args.userId,
    currentWeightKg: args.currentWeightKg,
    evolutionKg: args.previousWeightKg ? Number((args.currentWeightKg - args.previousWeightKg).toFixed(1)) : 0,
    trainedDays,
    currentStreak,
    favoriteExercises,
    maxLoadKg,
    trainingMinutes,
    postsCount: args.postCount,
    friendsCount: args.friendCount,
    followersCount: args.friendCount,
    trainingSinceDays: Math.max(1, trainedDays * 7),
  };
}
