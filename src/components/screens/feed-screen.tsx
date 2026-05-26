"use client";

import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Input, StrongSurface, Surface } from "@/components/ui/kit";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

function formatPostTime(value: string) {
  return format(new Date(value), "HH:mm");
}

export function FeedScreen() {
  const feedPosts = useStore(useAppStore, (state) => state.feedPosts);
  const profiles = useStore(useAppStore, (state) => state.profiles);
  const commentsByPost = useStore(useAppStore, (state) => state.commentsByPost);
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const toggleLike = useStore(useAppStore, (state) => state.toggleLike);
  const addComment = useStore(useAppStore, (state) => state.addComment);
  const toggleFollowProfile = useStore(useAppStore, (state) => state.toggleFollowProfile);
  const toggleFriendProfile = useStore(useAppStore, (state) => state.toggleFriendProfile);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const timeline = useMemo(
    () => [...feedPosts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [feedPosts],
  );
  const profileById = useMemo(() => Object.fromEntries(profiles.map((profile) => [profile.id, profile])), [profiles]);
  const currentProfile = profiles.find((profile) => profile.id === sessionUser?.id) ?? profiles[0];
  const suggestedProfiles = profiles.filter((profile) => profile.id !== currentProfile?.id);

  return (
    <PageFrame className="gap-5">
      <StrongSurface className="overflow-hidden rounded-[24px] p-0">
        <div className="relative min-h-[238px]">
          <img
            src={currentProfile?.coverImage ?? timeline[0]?.image}
            alt={currentProfile?.name ?? "Community"}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="cinema-overlay absolute inset-0" />
          <div className="relative flex min-h-[238px] flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/80">
                social fitness
              </div>
              <div className="rounded-full bg-black/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/70">
                {timeline.length} posts ao vivo
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:items-end">
              <div>
                <h2 className="max-w-md text-3xl font-semibold tracking-[-0.07em] md:text-4xl">
                  Comunidade, treino e ritmo em uma tela mais limpa.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
                  Abertura cinematografica, imagem dominante e interacao social com menos ruido visual.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[16px] bg-black/28 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">streak</p>
                  <p className="metric-number mt-2 text-xl">{currentProfile?.streak ?? 0}x</p>
                </div>
                <div className="rounded-[16px] bg-black/28 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">seguindo</p>
                  <p className="metric-number mt-2 text-xl">{currentProfile?.following ?? 0}</p>
                </div>
                <div className="rounded-[16px] bg-black/28 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">semana</p>
                  <p className="metric-number mt-2 text-xl">{currentProfile?.weeklyFrequency ?? 0}x</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StrongSurface>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {suggestedProfiles.map((profile) => (
          <Surface key={profile.id} className="min-w-[212px] rounded-[18px] p-3">
            <div className="flex items-center gap-3">
              <img src={profile.avatarImage} alt={profile.name} className="size-14 rounded-[16px] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile.name}</p>
                <p className="truncate text-xs text-[var(--muted)]">{profile.specialty}</p>
              </div>
              <button
                onClick={() => toggleFriendProfile(profile.id)}
                className={cn(
                  "rounded-[12px] px-3 py-2 text-xs uppercase tracking-[0.18em] transition",
                  profile.isFriend ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-white/5 text-[var(--muted)]",
                )}
              >
                {profile.isFriend ? "amigo" : "add"}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>{profile.streak} dias</span>
              <span>{profile.weeklyFrequency} treinos/semana</span>
            </div>
            <button
              onClick={() => toggleFollowProfile(profile.id)}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-sm transition",
                profile.isFollowing ? "bg-white text-black" : "bg-white/5 text-white",
              )}
            >
              <UserPlus className="size-4" />
              {profile.isFollowing ? "Seguindo" : "Seguir"}
            </button>
          </Surface>
        ))}
      </div>

      <div className="space-y-5">
        {timeline.map((post, index) => {
          const author = profileById[post.authorId];
          const comments = commentsByPost[post.id] ?? [];
          const liked = sessionUser ? post.likedByUserIds.includes(sessionUser.id) : post.likedByUserIds.length > 0;

          return (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 28, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.03, ease: "easeOut" }}
              className="overflow-hidden rounded-[24px] border border-white/7 bg-black"
            >
              <div className="relative min-h-[520px]">
                <img src={post.image} alt={post.caption} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="cinema-overlay absolute inset-0" />

                <div className="relative flex min-h-[520px] flex-col justify-between p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={author?.avatarImage ?? post.image}
                        alt={post.authorName}
                        className="size-12 rounded-[16px] border border-white/10 object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{post.authorName}</p>
                        <p className="text-xs text-white/62">{post.activityLabel}</p>
                      </div>
                    </div>

                    <div className="rounded-full bg-black/32 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/70">
                      {formatPostTime(post.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div className="max-w-[72%]">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">{author?.handle ?? "@pulse"}</p>
                      <h3 className="mt-2 text-[28px] font-semibold leading-[1.02] tracking-[-0.06em]">{post.authorName}</h3>
                      <p className="mt-2 text-sm text-white/72">{post.activityLabel}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.metricLabel ? (
                          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85">
                            {post.metricLabel}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85">
                          streak {post.streakDays}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={cn(
                          "flex size-12 items-center justify-center rounded-[16px] border border-white/10 backdrop-blur-sm transition",
                          liked ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-black/28 text-white",
                        )}
                      >
                        <Heart className="size-5" />
                      </button>
                      <button
                        onClick={() => setExpandedPostId((value) => (value === post.id ? null : post.id))}
                        className="flex size-12 items-center justify-center rounded-[16px] border border-white/10 bg-black/28 text-white backdrop-blur-sm transition hover:bg-black/40"
                      >
                        <MessageCircle className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/6 bg-[#090c11] px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                  <span>{post.likes} likes</span>
                  <span>{comments.length} comentarios</span>
                </div>
                {author ? (
                  <button
                    onClick={() => toggleFollowProfile(author.id)}
                    className={cn(
                      "rounded-[12px] px-3 py-2 text-xs uppercase tracking-[0.18em] transition",
                      author.isFollowing ? "bg-white text-black" : "bg-white/6 text-white",
                    )}
                  >
                    {author.isFollowing ? "Seguindo" : "Seguir"}
                  </button>
                ) : null}
              </div>

              <AnimatePresence initial={false}>
                {expandedPostId === post.id ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="overflow-hidden border-t border-white/6 bg-[#0b0f15]"
                  >
                    <div className="space-y-3 p-4">
                      {comments.slice(-2).map((comment) => (
                        <div key={comment.id} className="rounded-[14px] bg-white/4 px-3 py-3 text-sm">
                          <span className="font-medium">{comment.author}</span>
                          <span className="ml-2 text-[var(--muted)]">{comment.text}</span>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(event) => setCommentDrafts((state) => ({ ...state, [post.id]: event.target.value }))}
                          placeholder="Adicionar comentario"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const text = commentDrafts[post.id]?.trim();
                            if (!text) {
                              return;
                            }
                            addComment(post.id, text);
                            setCommentDrafts((state) => ({ ...state, [post.id]: "" }));
                          }}
                        >
                          enviar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </PageFrame>
  );
}
