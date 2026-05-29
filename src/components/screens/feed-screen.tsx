"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Heart, MailCheck, MessageCircle, PencilLine, UploadCloud, X } from "lucide-react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { SocialPostCard } from "@/components/social/social-post-card";
import { Button, Chip, Input, SectionHeading, StrongSurface, Surface, Textarea } from "@/components/ui/kit";
import { useCurrentSocialState, useSocialDirectory, useSocialFeed } from "@/hooks/use-social-session";
import { resendFirebaseVerification } from "@/lib/firebase/auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { createSocialPost, uploadPostImage } from "@/lib/firebase/social";
import { compressImage } from "@/lib/media";
import { canViewUserContent, relationshipForProfile } from "@/lib/social-utils";
import { useAppStore } from "@/store/app-store";
import type { SocialPost } from "@/types/social";

const postTypeOptions: SocialPost["postType"][] = ["workout", "run", "evolution", "pr", "achievement"];
const visibilityOptions: SocialPost["visibility"][] = ["public", "friends", "private"];

export function FeedScreen() {
  const socialReady = hasFirebaseConfig();
  const { sessionUser, profile, friendRequests, friendships, blocks } = useCurrentSocialState();
  const { profiles } = useSocialDirectory();
  const { posts, likedPostIds } = useSocialFeed();
  const localFeedPosts = useStore(useAppStore, (state) => state.feedPosts);
  const localComments = useStore(useAppStore, (state) => state.commentsByPost);
  const addLocalComment = useStore(useAppStore, (state) => state.addComment);
  const toggleLocalLike = useStore(useAppStore, (state) => state.toggleLike);
  const addLocalFeedPost = useStore(useAppStore, (state) => state.addFeedPost);

  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [postType, setPostType] = useState<SocialPost["postType"]>("workout");
  const [visibility, setVisibility] = useState<SocialPost["visibility"]>("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [composerError, setComposerError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [localCommentDrafts, setLocalCommentDrafts] = useState<Record<string, string>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const deferredPosts = useDeferredValue(posts);

  const activeProfiles = useMemo(
    () => profiles.filter((item) => item.accountStatus === "active" && item.profileCompleted),
    [profiles],
  );
  const profileById = useMemo(() => Object.fromEntries(activeProfiles.map((item) => [item.id, item])), [activeProfiles]);

  const visiblePosts = useMemo(() => {
    if (!sessionUser || !profile) {
      return [];
    }

    return deferredPosts.filter((post) => {
      const author = profileById[post.userId];

      if (!author || post.moderationState === "flagged") {
        return false;
      }

      const relationship = relationshipForProfile({
        viewerId: sessionUser.id,
        profileId: author.id,
        friendRequests,
        friendships,
        blocks,
      });

      return canViewUserContent(author, post.visibility, relationship);
    });
  }, [blocks, deferredPosts, friendRequests, friendships, profile, profileById, sessionUser]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + 4, visiblePosts.length));
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visiblePosts.length]);

  function resetComposer() {
    setCaption("");
    setLocation("");
    setSelectedFile(null);
    setVisibility("public");
    setPostType("workout");
    setComposerError("");
  }

  async function handlePublish() {
    if (!sessionUser || !profile || !selectedFile || !caption.trim()) {
      setComposerError("Selecione uma imagem e escreva uma legenda para publicar.");
      return;
    }

    setPublishing(true);
    setComposerError("");

    try {
      const postId = crypto.randomUUID();
      const imageUrl = await uploadPostImage(sessionUser.id, postId, selectedFile);

      await createSocialPost({
        postId,
        userId: sessionUser.id,
        caption,
        imageUrl,
        postType,
        location,
        visibility,
      });

      resetComposer();
      setComposerOpen(false);
    } catch (publishError) {
      setComposerError(publishError instanceof Error ? publishError.message : "Nao foi possivel publicar agora.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleLocalPublish() {
    if (!selectedFile || !caption.trim()) {
      setComposerError("Selecione uma imagem e escreva uma legenda para publicar.");
      return;
    }

    setComposerError("");
    setPublishing(true);

    try {
      const image = await compressImage(selectedFile);
      addLocalFeedPost({
        caption,
        image,
        activityLabel: location.trim() ? `Treino em ${location.trim()}` : "Novo update no feed",
        metricLabel: postType,
        type: postType === "run" ? "run" : postType === "achievement" || postType === "evolution" ? "progress" : "workout",
      });

      resetComposer();
      setComposerOpen(false);
    } catch (publishError) {
      setComposerError(publishError instanceof Error ? publishError.message : "Nao foi possivel publicar agora.");
    } finally {
      setPublishing(false);
    }
  }

  function renderComposerModal() {
    if (!composerOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xl">
        <StrongSurface className="w-full max-w-2xl rounded-[30px] p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">novo post</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.07em]">Escrever post</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setComposerOpen(false);
                setComposerError("");
              }}
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[var(--muted)] transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <Textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Compartilhe treino, corrida, PR, evolucao ou conquista."
              className="min-h-32"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Localizacao opcional" />
              <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-[14px] bg-white/5 px-4 text-sm text-[var(--muted)]">
                <span className="truncate">{selectedFile?.name ?? "Selecionar foto"}</span>
                <UploadCloud className="size-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {postTypeOptions.map((option) => (
                  <Chip key={option} active={postType === option} onClick={() => setPostType(option)}>
                    {option}
                  </Chip>
                ))}
              </div>

              {socialReady ? (
                <div className="flex flex-wrap gap-2">
                  {visibilityOptions.map((option) => (
                    <Chip key={option} active={visibility === option} onClick={() => setVisibility(option)}>
                      {option}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </div>

            {socialReady && !profile?.verifiedEmail ? (
              <div className="flex flex-col gap-3 rounded-[18px] border border-[rgba(156,255,121,0.16)] bg-white/[0.02] px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 size-5 text-[var(--accent)]" />
                  <p className="text-sm leading-6 text-[var(--muted)]">Confirme seu e-mail para publicar, curtir e comentar no feed.</p>
                </div>
                <Button variant="secondary" onClick={() => void resendFirebaseVerification()}>
                  Reenviar verificacao
                </Button>
              </div>
            ) : null}

            {composerError ? <p className="text-sm text-[var(--warn)]">{composerError}</p> : null}

            <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setComposerOpen(false);
                  setComposerError("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => void (socialReady ? handlePublish() : handleLocalPublish())}
                disabled={publishing || (socialReady && !profile?.verifiedEmail)}
              >
                {publishing ? "Publicando..." : "Publicar agora"}
              </Button>
            </div>
          </div>
        </StrongSurface>
      </div>
    );
  }

  return (
    <PageFrame className="gap-4">
      {renderComposerModal()}

      <StrongSurface className="rounded-[24px]">
        <SectionHeading eyebrow="feed" title="Postagens" />
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Toque em escrever post para abrir o composer por cima do app, com o fundo borrado.
          </p>
          <Button onClick={() => setComposerOpen(true)} className="gap-2 md:min-w-44">
            <PencilLine className="size-4" />
            Escrever post
          </Button>
        </div>
      </StrongSurface>

      {socialReady ? (
        <>
          {visiblePosts.length === 0 ? (
            <Surface className="rounded-[24px] p-6 text-sm leading-6 text-[var(--muted)]">
              Nenhum post apareceu ainda. Assim que voce publicar ou seguir perfis visiveis, o feed vai preencher aqui.
            </Surface>
          ) : null}

          <div className="space-y-5">
            {visiblePosts.slice(0, visibleCount).map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                liked={likedPostIds.includes(post.id)}
                canInteract={Boolean(profile?.verifiedEmail)}
                viewerProfile={profile}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-1 w-full" />
        </>
      ) : (
        <div className="space-y-5">
          {localFeedPosts.map((post) => {
            const comments = localComments[post.id] ?? [];
            const liked = Boolean(sessionUser && post.likedByUserIds.includes(sessionUser.id));

            return (
              <Surface key={post.id} className="overflow-hidden rounded-[26px] p-0">
                <img src={post.image} alt={post.caption} className="h-[420px] w-full object-cover" />
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{post.activityLabel}</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{post.caption}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant={liked ? "primary" : "secondary"} onClick={() => toggleLocalLike(post.id)} className="gap-2">
                        <Heart className="size-4" />
                        {post.likes}
                      </Button>
                      <Button variant="secondary" className="gap-2">
                        <MessageCircle className="size-4" />
                        {comments.length}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{new Date(post.createdAt).toLocaleDateString("pt-BR")}</p>
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-[16px] bg-white/4 px-4 py-3">
                        <p className="text-sm font-medium">{comment.author}</p>
                        <p className="mt-1 text-sm text-white/76">{comment.text}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={localCommentDrafts[post.id] ?? ""}
                        onChange={(event) => setLocalCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                        placeholder="Escrever comentario"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const nextText = (localCommentDrafts[post.id] ?? "").trim();

                          if (!nextText) {
                            return;
                          }

                          addLocalComment(post.id, nextText);
                          setLocalCommentDrafts((current) => ({ ...current, [post.id]: "" }));
                        }}
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                </div>
              </Surface>
            );
          })}

          {localFeedPosts.length === 0 ? (
            <Surface className="rounded-[24px] p-6 text-sm leading-6 text-[var(--muted)]">
              Nenhum post apareceu ainda. Assim que voce publicar, o feed vai preencher aqui.
            </Surface>
          ) : null}
        </div>
      )}
    </PageFrame>
  );
}
