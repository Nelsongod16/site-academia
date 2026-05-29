"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Heart, ImagePlus, MailCheck, MessageCircle, Sparkles, UploadCloud } from "lucide-react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { SocialPostCard } from "@/components/social/social-post-card";
import { Button, Chip, Input, SectionHeading, StrongSurface, Surface, Textarea } from "@/components/ui/kit";
import { useCurrentSocialState, useSocialDirectory, useSocialFeed } from "@/hooks/use-social-session";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { createSocialPost, sendFriendRequest, acceptFriendRequest, removeFriend, uploadPostImage } from "@/lib/firebase/social";
import { resendFirebaseVerification } from "@/lib/firebase/auth";
import { compressImage } from "@/lib/media";
import { buildDiscoveryBuckets, canViewUserContent, relationshipForProfile } from "@/lib/social-utils";
import { useAppStore } from "@/store/app-store";
import type { SocialPost } from "@/types/social";

const postTypeOptions: SocialPost["postType"][] = ["workout", "run", "evolution", "pr", "achievement"];
const visibilityOptions: SocialPost["visibility"][] = ["public", "friends", "private"];

export function FeedScreen() {
  const { sessionUser, profile, stats, friendRequests, friendships, blocks } = useCurrentSocialState();
  const { profiles, statsByUserId } = useSocialDirectory();
  const { posts, likedPostIds } = useSocialFeed();
  const localFeedPosts = useStore(useAppStore, (state) => state.feedPosts);
  const localComments = useStore(useAppStore, (state) => state.commentsByPost);
  const addLocalComment = useStore(useAppStore, (state) => state.addComment);
  const toggleLocalLike = useStore(useAppStore, (state) => state.toggleLike);
  const addLocalFeedPost = useStore(useAppStore, (state) => state.addFeedPost);
  const localProfiles = useStore(useAppStore, (state) => state.profiles);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [postType, setPostType] = useState<SocialPost["postType"]>("workout");
  const [visibility, setVisibility] = useState<SocialPost["visibility"]>("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [composerError, setComposerError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [localCommentDrafts, setLocalCommentDrafts] = useState<Record<string, string>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const deferredPosts = useDeferredValue(posts);

  const activeProfiles = useMemo(
    () => profiles.filter((item) => item.accountStatus === "active" && item.profileCompleted),
    [profiles],
  );
  const profileById = useMemo(() => Object.fromEntries(activeProfiles.map((item) => [item.id, item])), [activeProfiles]);
  const discovery = useMemo(() => buildDiscoveryBuckets(profile, activeProfiles, statsByUserId), [activeProfiles, profile, statsByUserId]);

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

      setCaption("");
      setLocation("");
      setSelectedFile(null);
      setVisibility("public");
      setPostType("workout");
    } catch (publishError) {
      setComposerError(publishError instanceof Error ? publishError.message : "Nao foi possivel publicar agora.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSuggestedAction(targetUserId: string) {
    if (!sessionUser) {
      return;
    }

    const relationship = relationshipForProfile({
      viewerId: sessionUser.id,
      profileId: targetUserId,
      friendRequests,
      friendships,
      blocks,
    });

    if (relationship.incomingPending) {
      const request = friendRequests.find(
        (item) => item.status === "pending" && item.fromUserId === targetUserId && item.toUserId === sessionUser.id,
      );
      if (request) {
        await acceptFriendRequest(request.id, sessionUser.id);
      }
      return;
    }

    if (relationship.isFriend) {
      await removeFriend(sessionUser.id, targetUserId);
      return;
    }

    if (!relationship.outgoingPending) {
      await sendFriendRequest(sessionUser.id, targetUserId);
    }
  }

  if (!hasFirebaseConfig()) {
    const mergedProfiles = localProfiles.filter((item) => item.id !== sessionUser?.id);

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
          type: postType === "run" ? "run" : postType === "achievement" ? "progress" : postType === "evolution" ? "progress" : "workout",
        });
        setCaption("");
        setLocation("");
        setSelectedFile(null);
      } catch (publishError) {
        setComposerError(publishError instanceof Error ? publishError.message : "Nao foi possivel publicar agora.");
      } finally {
        setPublishing(false);
      }
    }

    return (
      <PageFrame className="gap-5">
        <StrongSurface className="overflow-hidden rounded-[28px] p-0">
          <div className="relative min-h-[240px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(156,255,121,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(79,209,255,0.16),transparent_24%),linear-gradient(180deg,#0b1017_0%,#090c12_100%)]" />
            <div className="relative grid min-h-[240px] gap-6 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
              <div>
                <div className="inline-flex items-center rounded-full bg-white/6 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/72">
                  feed local ativo
                </div>
                <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.08em] md:text-5xl">Seu feed continua funcionando sem Firebase.</h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/72">
                  Publice updates, acompanhe curtidas e teste a experiencia social completa usando a base local do app.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 self-end">
                <div className="rounded-[18px] bg-black/26 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/56">posts</p>
                  <p className="metric-number mt-2 text-xl">{localFeedPosts.length}</p>
                </div>
                <div className="rounded-[18px] bg-black/26 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/56">likes</p>
                  <p className="metric-number mt-2 text-xl">{localFeedPosts.reduce((total, post) => total + post.likes, 0)}</p>
                </div>
                <div className="rounded-[18px] bg-black/26 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/56">pessoas</p>
                  <p className="metric-number mt-2 text-xl">{localProfiles.length}</p>
                </div>
              </div>
            </div>
          </div>
        </StrongSurface>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <StrongSurface className="rounded-[24px]">
            <SectionHeading eyebrow="novo post" title="Compartilhar update" />
            <div className="mt-4 space-y-3">
              <Textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Compartilhe treino, corrida, evolucao ou conquista." />
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Localizacao opcional" />
                <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-[14px] bg-white/5 px-4 text-sm text-[var(--muted)]">
                  <span className="truncate">{selectedFile?.name ?? "Selecionar foto"}</span>
                  <ImagePlus className="size-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {postTypeOptions.map((option) => (
                  <Chip key={option} active={postType === option} onClick={() => setPostType(option)}>
                    {option}
                  </Chip>
                ))}
              </div>
              {composerError ? <p className="text-sm text-[var(--warn)]">{composerError}</p> : null}
              <Button onClick={() => void handleLocalPublish()} disabled={publishing}>
                {publishing ? "Publicando..." : "Publicar agora"}
              </Button>
            </div>
          </StrongSurface>

          <StrongSurface className="rounded-[24px]">
            <SectionHeading eyebrow="comunidade" title="Perfis locais" />
            <div className="mt-4 space-y-3">
              {mergedProfiles.slice(0, 4).map((person) => (
                <div key={person.id} className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.035] p-3">
                  <img src={person.avatarImage} alt={person.name} className="size-16 rounded-[18px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    <p className="truncate text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{person.handle}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{person.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </StrongSurface>
        </div>

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
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="gap-5">
      <StrongSurface className="overflow-hidden rounded-[28px] p-0">
        <div className="relative min-h-[260px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(156,255,121,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(79,209,255,0.16),transparent_24%),linear-gradient(180deg,#0b1017_0%,#090c12_100%)]" />
          <div className="relative grid min-h-[260px] gap-6 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/6 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/72">
                social feed realtime
              </div>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.08em] md:text-5xl">
                Treino, evolucao e conexoes em um feed premium.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/72">
                Agora o feed mostra somente perfis reais cadastrados, respeita privacidade e atualiza curtidas, comentarios e amizades em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 self-end">
              <div className="rounded-[18px] bg-black/26 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/56">peso</p>
                <p className="metric-number mt-2 text-xl">{stats?.currentWeightKg ?? profile?.weightKg ?? 0} kg</p>
              </div>
              <div className="rounded-[18px] bg-black/26 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/56">streak</p>
                <p className="metric-number mt-2 text-xl">{stats?.currentStreak ?? 0}</p>
              </div>
              <div className="rounded-[18px] bg-black/26 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/56">posts</p>
                <p className="metric-number mt-2 text-xl">{stats?.postsCount ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </StrongSurface>

      {!profile?.verifiedEmail ? (
        <Surface className="rounded-[22px] border border-[rgba(156,255,121,0.16)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 size-5 text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium">Confirme seu e-mail para publicar, curtir e comentar.</p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Isso ajuda a reduzir perfis fake e libera as interacoes sociais do app.
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => void resendFirebaseVerification()}>
              Reenviar verificacao
            </Button>
          </div>
        </Surface>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <StrongSurface className="rounded-[24px]">
          <SectionHeading eyebrow="novo post" title="Compartilhar update" />
          <div className="mt-4 space-y-3">
            <Textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Compartilhe treino, corrida, PR, evolucao ou conquista." />
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Localizacao opcional" />
              <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-[14px] bg-white/5 px-4 text-sm text-[var(--muted)]">
                <span className="truncate">{selectedFile?.name ?? "Selecionar foto otimizada"}</span>
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
              <div className="flex flex-wrap gap-2">
                {visibilityOptions.map((option) => (
                  <Chip key={option} active={visibility === option} onClick={() => setVisibility(option)}>
                    {option}
                  </Chip>
                ))}
              </div>
            </div>
            {composerError ? <p className="text-sm text-[var(--warn)]">{composerError}</p> : null}
            <Button onClick={() => void handlePublish()} disabled={publishing || !profile?.verifiedEmail}>
              {publishing ? "Publicando..." : "Publicar agora"}
            </Button>
          </div>
        </StrongSurface>

        <StrongSurface className="rounded-[24px]">
          <SectionHeading eyebrow="descobrir" title="Perfis em destaque" />
          <div className="mt-4 space-y-3">
            {discovery.recommended.slice(0, 4).map((suggestedProfile) => {
              const relationship = relationshipForProfile({
                viewerId: sessionUser?.id,
                profileId: suggestedProfile.id,
                friendRequests,
                friendships,
                blocks,
              });

              return (
                <div key={suggestedProfile.id} className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.035] p-3">
                  <img src={suggestedProfile.avatarUrl} alt={suggestedProfile.fullName} className="size-16 rounded-[18px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{suggestedProfile.fullName}</p>
                    <p className="truncate text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{suggestedProfile.username}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {suggestedProfile.city}, {suggestedProfile.country} · {suggestedProfile.fitnessGoal}
                    </p>
                  </div>
                  <Button variant={relationship.isFriend ? "primary" : "secondary"} onClick={() => void handleSuggestedAction(suggestedProfile.id)}>
                    {relationship.isFriend ? "Amigos" : relationship.outgoingPending ? "Solicitado" : relationship.incomingPending ? "Aceitar" : "Adicionar"}
                  </Button>
                </div>
              );
            })}
            {discovery.recommended.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-white/8 p-4 text-sm text-[var(--muted)]">
                Seus destaques vao aparecer conforme novos usuarios reais completarem o perfil.
              </div>
            ) : null}
          </div>
        </StrongSurface>
      </div>

      <div className="flex items-center justify-between gap-3">
        <SectionHeading eyebrow="timeline" title="Feed social" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          <Sparkles className="size-3.5" />
          {visiblePosts.length} posts visiveis
        </div>
      </div>

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

      {visiblePosts.length === 0 ? (
        <Surface className="rounded-[24px] p-6 text-sm leading-6 text-[var(--muted)]">
          Nenhum post real apareceu ainda para sua combinacao atual de privacidade e amizades. Complete o perfil, adicione amigos ou publique o primeiro update.
        </Surface>
      ) : null}

      <div ref={sentinelRef} className="h-1 w-full" />
    </PageFrame>
  );
}
