export type SocialVisibility = "public" | "friends" | "private";
export type SocialAccountStatus = "pending" | "active" | "banned";
export type SocialModerationState = "clean" | "flagged" | "review";
export type SocialSex = "feminino" | "masculino" | "nao-informar" | "outro";
export type SocialPostType = "evolution" | "pr" | "workout" | "run" | "achievement";
export type SocialNotificationType = "friend_request" | "friend_accept" | "like" | "comment" | "mention" | "follow_future";
export type FriendRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type ReportTargetType = "user" | "post" | "comment";
export type MessageThreadStatus = "planned" | "active" | "archived";

export interface RunPostMetrics {
  runTime?: string;
  runDistance?: string;
  runPace?: string;
}

export interface SocialProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  usernameKey: string;
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
  sex: SocialSex;
  visibility: SocialVisibility;
  verifiedEmail: boolean;
  profileCompleted: boolean;
  accountStatus: SocialAccountStatus;
  moderationState: SocialModerationState;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  searchIndex: string[];
}

export interface SocialStats {
  userId: string;
  currentWeightKg: number;
  evolutionKg: number;
  trainedDays: number;
  currentStreak: number;
  favoriteExercises: string[];
  maxLoadKg: number;
  trainingMinutes: number;
  postsCount: number;
  friendsCount: number;
  followersCount: number;
  trainingSinceDays: number;
  updatedAt: string;
}

export interface PhysicalProgressEntry {
  id: string;
  userId: string;
  weightKg: number;
  note: string;
  imageUrl?: string;
  createdAt: string;
}

export interface SocialPost extends RunPostMetrics {
  id: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string;
  caption: string;
  imageUrl: string;
  postType: SocialPostType;
  location?: string;
  visibility: SocialVisibility;
  likesCount: number;
  commentsCount: number;
  moderationState: SocialModerationState;
  createdAt: string;
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string;
  text: string;
  moderationState: SocialModerationState;
  createdAt: string;
}

export interface SocialLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: string;
  pairKey: string;
  users: [string, string];
  createdAt: string;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface SocialNotification {
  id: string;
  userId: string;
  actorUserId: string;
  type: SocialNotificationType;
  postId?: string;
  commentId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
}

export interface MessageThread {
  id: string;
  members: string[];
  status: MessageThreadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SocialDiscoveryBuckets {
  recommended: SocialProfile[];
  sameCity: SocialProfile[];
  sameGoal: SocialProfile[];
  sameTrainingStyle: SocialProfile[];
  popular: SocialProfile[];
  recentlyActive: SocialProfile[];
}

export interface SocialRelationshipState {
  isSelf: boolean;
  isFriend: boolean;
  outgoingPending: boolean;
  incomingPending: boolean;
  blockedByViewer: boolean;
  blockedViewer: boolean;
}

export interface SocialProfileInput {
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
  sex: SocialSex;
  visibility: SocialVisibility;
}
