"use client";

import { format } from "date-fns";
import { Bookmark, Heart, MessageCircle, PlusSquare, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Input, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { useAppStore } from "@/store/app-store";

export function FeedScreen() {
  const feedPosts = useStore(useAppStore, (state) => state.feedPosts);
  const commentsByPost = useStore(useAppStore, (state) => state.commentsByPost);
  const toggleLike = useStore(useAppStore, (state) => state.toggleLike);
  const addComment = useStore(useAppStore, (state) => state.addComment);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const timeline = useMemo(
    () =>
      [...feedPosts]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((post) => ({
          ...post,
          baseId: post.id,
        })),
    [feedPosts],
  );

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="feed social" title="Comunidade Pulse" />
        <p className="mt-2 text-sm text-[var(--muted)]">Stories, posts grandes, comentarios e visual mais proximo de rede social real.</p>
      </StrongSurface>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {timeline.map((post) => (
          <div key={`story-${post.id}`} className="min-w-[84px] text-center">
            <div className="mx-auto flex size-18 items-center justify-center rounded-full bg-gradient-to-br from-[var(--warn)] via-[var(--violet)] to-[var(--accent)] p-[2px]">
              <div className="flex size-full items-center justify-center rounded-full bg-[var(--surface-strong)] text-sm font-semibold">
                {post.avatar}
              </div>
            </div>
            <p className="mt-2 truncate text-xs text-[var(--muted)]">{post.authorName}</p>
          </div>
        ))}
      </div>

      <Surface className="rounded-[28px] bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Compartilhar algo hoje</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Treino, corrida, progresso ou foto do dia.</p>
          </div>
          <button className="rounded-full bg-white p-3 text-black">
            <PlusSquare className="size-4" />
          </button>
        </div>
      </Surface>

      <div className="space-y-4">
        {timeline.map((post) => {
          const comments = commentsByPost[post.baseId] ?? [];
          const liked = post.likedByUserIds.length > 0;

          return (
            <Surface key={post.id} className="overflow-hidden rounded-[28px] p-0">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-white/8 text-sm font-semibold">{post.avatar}</div>
                  <div>
                    <p className="text-sm font-medium">{post.authorName}</p>
                    <p className="text-xs text-[var(--muted)]">{format(new Date(post.createdAt), "dd/MM · HH:mm")}</p>
                  </div>
                </div>
                <div className="rounded-full bg-white/6 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  {post.statsLabel}
                </div>
              </div>

              <img src={post.image} alt={post.caption} className="h-[420px] w-full object-cover" loading="lazy" />

              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLike(post.baseId)} className={liked ? "text-[var(--accent)]" : "text-white"}>
                      <Heart className="size-5" />
                    </button>
                    <button className="text-white">
                      <MessageCircle className="size-5" />
                    </button>
                    <button className="text-white">
                      <Send className="size-5" />
                    </button>
                  </div>
                  <Bookmark className="size-5 text-[var(--muted)]" />
                </div>

                <div>
                  <p className="text-sm font-medium">{post.likes} curtidas</p>
                  <p className="mt-2 text-sm">{post.caption}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    streak {post.streakDays} · {post.consecutiveDays} dias seguidos ·{" "}
                    {post.workoutMinutes ? `${post.workoutMinutes} min` : post.runTime ?? `${post.swimDistance ?? 0} m`}
                    {post.runKm ? ` · ${post.runKm} km` : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-[16px] bg-white/5 px-4 py-3 text-sm">
                      <span className="font-medium">{comment.author}</span> <span className="text-[var(--muted)]">{comment.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={commentDrafts[post.baseId] ?? ""}
                      onChange={(event) => setCommentDrafts((state) => ({ ...state, [post.baseId]: event.target.value }))}
                      placeholder="Escreva um comentario"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const text = commentDrafts[post.baseId]?.trim();
                        if (!text) {
                          return;
                        }
                        addComment(post.baseId, text);
                        setCommentDrafts((state) => ({ ...state, [post.baseId]: "" }));
                      }}
                    >
                      enviar
                    </Button>
                  </div>
                </div>
              </div>
            </Surface>
          );
        })}
      </div>
    </PageFrame>
  );
}
