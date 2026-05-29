"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, Heart, MapPin, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { RunPostMetrics } from "@/components/social/run-post-metrics";
import { Button, Input } from "@/components/ui/kit";
import { addPostComment, reportEntity, subscribePostComments, togglePostLike } from "@/lib/firebase/social";
import type { SocialComment, SocialPost, SocialProfile } from "@/types/social";

const postTypeLabels: Record<SocialPost["postType"], string> = {
  achievement: "Conquista",
  evolution: "Evolucao",
  pr: "PR",
  run: "Corrida",
  workout: "Treino",
};

export function SocialPostCard({
  post,
  liked,
  canInteract,
  viewerProfile,
}: {
  post: SocialPost;
  liked: boolean;
  canInteract: boolean;
  viewerProfile: SocialProfile | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    return subscribePostComments(post.id, setComments);
  }, [expanded, post.id]);

  async function handleLike() {
    if (!viewerProfile) {
      return;
    }

    setBusy(true);
    try {
      await togglePostLike(post.id, viewerProfile.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleComment() {
    if (!viewerProfile || !commentDraft.trim()) {
      return;
    }

    setBusy(true);
    try {
      await addPostComment({
        postId: post.id,
        userId: viewerProfile.id,
        text: commentDraft,
      });
      setCommentDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function handleReport() {
    if (!viewerProfile) {
      return;
    }

    await reportEntity({
      reporterUserId: viewerProfile.id,
      targetType: "post",
      targetId: post.id,
      reason: "Conteudo suspeito",
      details: "Marcado pelo usuario a partir do feed.",
    });
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className="overflow-hidden rounded-[28px] border border-white/8 bg-[#080c11]"
    >
      <div className="relative min-h-[520px]">
        <img src={post.imageUrl} alt={post.caption} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.12)_0%,rgba(8,10,14,0.22)_38%,rgba(8,10,14,0.9)_100%)]" />

        <div className="relative flex min-h-[520px] flex-col justify-between p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/social/${post.authorUsername.replace(/^@/, "")}`} className="flex items-center gap-3">
              <img src={post.authorAvatarUrl} alt={post.authorName} className="size-12 rounded-[16px] border border-white/10 object-cover" />
              <div>
                <p className="text-sm font-medium">{post.authorName}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-white/62">{post.authorUsername}</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-black/34 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70">
                {postTypeLabels[post.postType]}
              </div>
              <button
                onClick={() => void handleReport()}
                className="flex size-11 items-center justify-center rounded-[15px] border border-white/10 bg-black/24 text-white/70 backdrop-blur-sm transition hover:bg-black/38"
              >
                <Flag className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/9 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80">{post.visibility}</span>
                {post.location ? (
                  <span className="inline-flex items-center rounded-full bg-white/9 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80">
                    <MapPin className="mr-1.5 size-3.5" />
                    {post.location}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 text-[30px] font-semibold leading-[1.02] tracking-[-0.06em]">{post.caption}</h3>
              {post.postType === "run" ? (
                <RunPostMetrics runTime={post.runTime} runDistance={post.runDistance} runPace={post.runPace} />
              ) : null}
              <p className="mt-3 text-sm text-white/70">
                {new Date(post.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex gap-2 md:flex-col">
              <button
                onClick={() => void handleLike()}
                disabled={!canInteract || busy}
                className={`flex size-12 items-center justify-center rounded-[16px] border border-white/10 backdrop-blur-sm transition ${
                  liked ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-black/28 text-white"
                }`}
              >
                <Heart className="size-5" />
              </button>
              <button
                onClick={() => setExpanded((current) => !current)}
                className="flex size-12 items-center justify-center rounded-[16px] border border-white/10 bg-black/28 text-white backdrop-blur-sm transition hover:bg-black/40"
              >
                <MessageCircle className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/8 bg-[#090d13] px-4 py-3 text-sm text-[var(--muted)]">
        <span>{post.likesCount} curtidas</span>
        <span>{post.commentsCount} comentarios</span>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/7 bg-[#0c1016]"
          >
            <div className="space-y-3 p-4">
              {comments.length === 0 ? <p className="text-sm text-[var(--muted)]">Seja a primeira pessoa a comentar.</p> : null}
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-[16px] bg-white/4 px-4 py-3">
                  <p className="text-sm font-medium">
                    {comment.authorName}
                    <span className="ml-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{comment.authorUsername}</span>
                  </p>
                  <p className="mt-2 text-sm text-white/76">{comment.text}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder={canInteract ? "Escrever comentario" : "Confirme o e-mail para comentar"}
                  disabled={!canInteract || busy}
                />
                <Button variant="secondary" onClick={() => void handleComment()} disabled={!canInteract || busy || !commentDraft.trim()}>
                  enviar
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
