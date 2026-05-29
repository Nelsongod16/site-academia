"use client";

import { Flag, Lock, ShieldBan, UserPlus, UserRoundCheck } from "lucide-react";
import { useMemo } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import { SocialPostCard } from "@/components/social/social-post-card";
import { Button, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { useCurrentSocialState, useProfilePosts, useSocialDirectory } from "@/hooks/use-social-session";
import { acceptFriendRequest, blockUser, cancelFriendRequest, removeFriend, reportEntity, sendFriendRequest } from "@/lib/firebase/social";
import { canViewProfile, canViewUserContent, normalizeUsername, relationshipForProfile } from "@/lib/social-utils";

export function PublicProfileScreen({ username }: { username: string }) {
  const { sessionUser, profile: viewerProfile, friendRequests, friendships, blocks } = useCurrentSocialState();
  const { profiles, statsByUserId } = useSocialDirectory();

  const targetProfile = useMemo(
    () => profiles.find((item) => normalizeUsername(item.username) === normalizeUsername(username)),
    [profiles, username],
  );
  const relationship = useMemo(
    () =>
      relationshipForProfile({
        viewerId: sessionUser?.id,
        profileId: targetProfile?.id ?? "",
        friendRequests,
        friendships,
        blocks,
      }),
    [blocks, friendRequests, friendships, sessionUser?.id, targetProfile?.id],
  );
  const canOpenProfile = targetProfile ? canViewProfile(targetProfile, relationship) : false;
  const targetPosts = useProfilePosts(targetProfile?.id).filter((post) => (targetProfile ? canViewUserContent(targetProfile, post.visibility, relationship) : false));
  const targetStats = targetProfile ? statsByUserId[targetProfile.id] : null;

  async function handlePrimaryAction() {
    if (!sessionUser || !targetProfile) {
      return;
    }

    if (relationship.incomingPending) {
      const request = friendRequests.find(
        (item) => item.status === "pending" && item.fromUserId === targetProfile.id && item.toUserId === sessionUser.id,
      );
      if (request) {
        await acceptFriendRequest(request.id, sessionUser.id);
      }
      return;
    }

    if (relationship.outgoingPending) {
      await cancelFriendRequest(sessionUser.id, targetProfile.id);
      return;
    }

    if (relationship.isFriend) {
      await removeFriend(sessionUser.id, targetProfile.id);
      return;
    }

    await sendFriendRequest(sessionUser.id, targetProfile.id);
  }

  async function handleBlock() {
    if (!sessionUser || !targetProfile) {
      return;
    }

    await blockUser(sessionUser.id, targetProfile.id);
  }

  async function handleReport() {
    if (!sessionUser || !targetProfile) {
      return;
    }

    await reportEntity({
      reporterUserId: sessionUser.id,
      targetType: "user",
      targetId: targetProfile.id,
      reason: "Perfil suspeito",
      details: "Denuncia iniciada na pagina publica do perfil.",
    });
  }

  if (!targetProfile) {
    return (
      <PageFrame>
        <StrongSurface className="rounded-[28px]">
          <h2 className="text-3xl font-semibold tracking-[-0.07em]">Perfil nao encontrado.</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">Esse username nao corresponde a um usuario ativo no banco.</p>
        </StrongSurface>
      </PageFrame>
    );
  }

  if (!canOpenProfile) {
    return (
      <PageFrame>
        <StrongSurface className="rounded-[28px]">
          <div className="flex items-start gap-4">
            <Lock className="mt-1 size-5 text-[var(--warn)]" />
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.07em]">Esse perfil esta restrito.</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                A visibilidade atual nao permite abrir o conteudo completo. Perfis privados ou so para amigos respeitam a configuracao de privacidade escolhida pelo usuario.
              </p>
            </div>
          </div>
        </StrongSurface>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="gap-5">
      <StrongSurface className="overflow-hidden rounded-[30px] p-0">
        <div className="relative min-h-[400px]">
          <img src={targetProfile.avatarUrl} alt={targetProfile.fullName} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,12,0.08)_0%,rgba(5,8,12,0.34)_36%,rgba(5,8,12,0.92)_100%)]" />
          <div className="relative flex min-h-[400px] flex-col justify-between p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/74">
                perfil publico
              </div>
              <div className="flex gap-2">
                <button onClick={() => void handleReport()} className="rounded-[14px] border border-white/10 bg-black/28 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/74">
                  <Flag className="mr-2 inline size-3.5" />
                  denunciar
                </button>
                <button onClick={() => void handleBlock()} className="rounded-[14px] border border-white/10 bg-black/28 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/74">
                  <ShieldBan className="mr-2 inline size-3.5" />
                  bloquear
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-end gap-4">
                <img src={targetProfile.avatarUrl} alt={targetProfile.fullName} className="size-24 rounded-[26px] border border-white/12 object-cover" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">{targetProfile.username}</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-[-0.08em]">{targetProfile.fullName}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/74">{targetProfile.bio || targetProfile.fitnessGoal}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/58">
                    {targetProfile.city}, {targetProfile.country} · {targetProfile.fitnessGoal}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void handlePrimaryAction()}>
                  {relationship.isFriend ? <UserRoundCheck className="mr-2 size-4" /> : <UserPlus className="mr-2 size-4" />}
                  {relationship.isFriend ? "Amigos" : relationship.outgoingPending ? "Solicitado" : relationship.incomingPending ? "Aceitar amizade" : "Adicionar amigo"}
                </Button>
                <Button variant="secondary" disabled>
                  Mensagem futura
                </Button>
                <Button variant="ghost" disabled>
                  Seguir futura expansao
                </Button>
              </div>
            </div>
          </div>
        </div>
      </StrongSurface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">peso atual</p>
          <p className="metric-number mt-2 text-3xl">{targetStats?.currentWeightKg ?? targetProfile.weightKg} kg</p>
        </Surface>
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">evolucao</p>
          <p className="metric-number mt-2 text-3xl">{targetStats?.evolutionKg ?? 0} kg</p>
        </Surface>
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">dias treinados</p>
          <p className="metric-number mt-2 text-3xl">{targetStats?.trainedDays ?? 0}</p>
        </Surface>
        <Surface className="rounded-[22px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">sequencia</p>
          <p className="metric-number mt-2 text-3xl">{targetStats?.currentStreak ?? 0}</p>
        </Surface>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Surface className="rounded-[24px]">
          <SectionHeading eyebrow="estatisticas" title="Resumo fitness" />
          <div className="mt-4 space-y-3">
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">exercicios favoritos</p>
              <p className="mt-2 text-sm text-white/78">{targetStats?.favoriteExercises.join(" · ") || "Ainda sem favoritos publicos"}</p>
            </div>
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">carga maxima</p>
              <p className="metric-number mt-2 text-3xl">{targetStats?.maxLoadKg ?? 0} kg</p>
            </div>
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">tempo treinando</p>
              <p className="metric-number mt-2 text-3xl">{targetStats?.trainingMinutes ?? 0} min</p>
            </div>
            <div className="rounded-[18px] bg-white/4 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">posts e amigos</p>
              <p className="mt-2 text-sm text-white/78">
                {targetStats?.postsCount ?? targetPosts.length} posts · {targetStats?.friendsCount ?? 0} amigos
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="rounded-[24px]">
          <SectionHeading eyebrow="perfil" title="Camada publica" />
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>Sexo: {targetProfile.sex}</p>
            <p>Altura: {targetProfile.heightCm} cm</p>
            <p>Estilos: {targetProfile.trainingStyles.join(" · ")}</p>
            <p>Ultima atividade: {new Date(targetProfile.lastActiveAt).toLocaleString("pt-BR")}</p>
            <p>Conta verificada: {targetProfile.verifiedEmail ? "sim" : "nao"}</p>
          </div>
        </Surface>
      </div>

      <SectionHeading eyebrow="posts" title="Feed do usuario" />
      <div className="space-y-5">
        {targetPosts.map((post) => (
          <SocialPostCard
            key={post.id}
            post={post}
            liked={false}
            canInteract={Boolean(viewerProfile?.verifiedEmail)}
            viewerProfile={viewerProfile}
          />
        ))}
        {targetPosts.length === 0 ? (
          <Surface className="rounded-[22px] p-5 text-sm text-[var(--muted)]">
            Esse perfil ainda nao publicou fotos, evolucao, PRs ou treinos com visibilidade para voce.
          </Surface>
        ) : null}
      </div>
    </PageFrame>
  );
}
