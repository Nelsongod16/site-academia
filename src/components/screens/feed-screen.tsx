"use client";

import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, Input, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { useAppStore } from "@/store/app-store";

export function FeedScreen() {
  const feedPosts = useStore(useAppStore, (state) => state.feedPosts);
  const commentsByPost = useStore(useAppStore, (state) => state.commentsByPost);
  const toggleLike = useStore(useAppStore, (state) => state.toggleLike);
  const addComment = useStore(useAppStore, (state) => state.addComment);
  const [visibleBatches, setVisibleBatches] = useState(2);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const timeline = useMemo(
    () =>
      Array.from({ length: visibleBatches }).flatMap((_, batchIndex) =>
        feedPosts.map((post) => ({
          ...post,
          id: `${post.id}-${batchIndex}`,
          baseId: post.id,
          createdAt: post.createdAt,
        })),
      ),
    [feedPosts, visibleBatches],
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleBatches((value) => Math.min(value + 1, 4));
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="feed social" title="Atividade recente" />
        <p className="mt-2 text-sm text-[var(--muted)]">Linha do tempo compacta com fotos grandes e estatisticas curtas.</p>
      </StrongSurface>

      <div className="space-y-4">
        {timeline.map((post) => {
          const comments = commentsByPost[post.baseId] ?? [];
          const liked = post.likedByUserIds.length > 0;

          return (
            <Surface key={post.id} className="overflow-hidden rounded-[28px] p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{post.authorName}</p>
                  <p className="text-xs text-[var(--muted)]">{format(new Date(post.createdAt), "dd/MM · HH:mm")}</p>
                </div>
                <div className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  {post.statsLabel}
                </div>
              </div>

              <img src={post.image} alt={post.caption} className="h-[360px] w-full object-cover" loading="lazy" />

              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{post.caption}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      streak {post.streakDays} · {post.consecutiveDays} dias seguidos
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    <p>{post.workoutMinutes ? `${post.workoutMinutes} min` : post.runTime ?? `${post.swimDistance ?? 0} m`}</p>
                    {post.runKm ? <p>{post.runKm} km</p> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant={liked ? "primary" : "secondary"} onClick={() => toggleLike(post.baseId)} className="gap-2">
                    <Heart className="size-4" />
                    {post.likes}
                  </Button>
                  <div className="rounded-[16px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-[var(--muted)]">
                    <MessageCircle className="mr-2 inline size-4" />
                    {comments.length}
                  </div>
                </div>

                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-[16px] border border-white/6 bg-white/3 px-4 py-3 text-sm">
                      <span className="font-medium">{comment.author}</span> <span className="text-[var(--muted)]">{comment.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={commentDrafts[post.baseId] ?? ""}
                      onChange={(event) => setCommentDrafts((state) => ({ ...state, [post.baseId]: event.target.value }))}
                      placeholder="Comentario rapido"
                    />
                    <Button
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

      <div ref={sentinelRef} className="h-8" />
    </PageFrame>
  );
}
