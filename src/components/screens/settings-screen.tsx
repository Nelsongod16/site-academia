"use client";

import { ShieldCheck, Smartphone, Wifi, Workflow } from "lucide-react";
import { useState } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import { ProfileOnboardingModal } from "@/components/social/profile-onboarding-modal";
import { Button, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { useCurrentSocialState } from "@/hooks/use-social-session";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { logoutFromFirebase, resendFirebaseVerification } from "@/lib/firebase/auth";
import { useAppStore } from "@/store/app-store";

export function SettingsScreen() {
  const signOut = useAppStore((state) => state.signOut);
  const { sessionUser, profile, notifications } = useCurrentSocialState();
  const [editingProfile, setEditingProfile] = useState(false);

  async function handleSignOut() {
    await logoutFromFirebase();
    signOut();
  }

  return (
    <>
      <PageFrame className="gap-5">
        <StrongSurface className="rounded-[30px]">
          <SectionHeading eyebrow="configuracoes" title="Conta, privacidade e social" />
        </StrongSurface>

        <div className="grid gap-4 md:grid-cols-2">
          <Surface className="rounded-[28px]">
            <div className="flex items-center gap-3">
              <Wifi className="size-4 text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium">Sincronizacao</p>
                <p className="text-xs text-[var(--muted)]">
                  {hasFirebaseConfig() ? "Conta online, banco e midia ativos para sincronizacao entre dispositivos." : "Banco local ativo para conta, perfil e ajustes do app."}
                </p>
              </div>
            </div>
          </Surface>
          <Surface className="rounded-[28px]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-[var(--sky)]" />
              <div>
                <p className="text-sm font-medium">Protecao anti-fake</p>
                <p className="text-xs text-[var(--muted)]">Username unico, e-mail verificado, denuncia e contas moderadas ocultas.</p>
              </div>
            </div>
          </Surface>
          <Surface className="rounded-[28px]">
            <div className="flex items-center gap-3">
              <Smartphone className="size-4 text-[var(--warn)]" />
              <div>
                <p className="text-sm font-medium">PWA e imagens</p>
                <p className="text-xs text-[var(--muted)]">Upload comprimido, lazy loading, cards mobile-first e instalacao pronta.</p>
              </div>
            </div>
          </Surface>
          <Surface className="rounded-[28px]">
            <div className="flex items-center gap-3">
              <Workflow className="size-4 text-[var(--violet)]" />
              <div>
                <p className="text-sm font-medium">Arquitetura escalavel</p>
                <p className="text-xs text-[var(--muted)]">Colecoes separadas para usuarios, amizades, posts, comentarios, curtidas e notificacoes.</p>
              </div>
            </div>
          </Surface>
        </div>

        <StrongSurface className="rounded-[28px]">
          <SectionHeading eyebrow="perfil" title="Conta social" />
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-center gap-4">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="size-20 rounded-[24px] object-cover" />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-[24px] bg-white/6 text-2xl font-semibold">
                  {sessionUser?.avatar ?? "PS"}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">{profile?.fullName ?? sessionUser?.name ?? "Conta sem perfil completo"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{profile?.username ?? sessionUser?.email}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {profile
                    ? `${profile.city}, ${profile.country} · ${profile.visibility}`
                    : "Finalize o perfil social para liberar a rede de amigos."}
                </p>
              </div>
            </div>
            <Button onClick={() => setEditingProfile(true)}>{profile ? "Editar perfil" : "Completar perfil"}</Button>
          </div>
        </StrongSurface>

        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="verificacao" title="E-mail e seguranca" />
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">{profile?.verifiedEmail ? "E-mail confirmado" : "E-mail pendente"}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {hasFirebaseConfig()
                  ? "Interacoes sociais completas dependem de confirmacao de e-mail para reduzir spam e contas descartaveis."
                  : "No modo local, voce pode ajustar foto, dados e perfil sem depender de verificacao externa."}
              </p>
            </div>
            {!profile?.verifiedEmail && hasFirebaseConfig() ? (
              <Button variant="secondary" onClick={() => void resendFirebaseVerification()}>
                Reenviar verificacao
              </Button>
            ) : null}
          </div>
        </Surface>

        <Surface className="rounded-[28px]">
          <SectionHeading eyebrow="moderacao" title="Privacidade e conteudo" />
          <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <p>Visibilidade atual: {profile?.visibility ?? "nao definida"}</p>
            <p>Notificacoes em tempo real registradas: {notifications.length}</p>
            <p>Estado de moderacao: {profile?.moderationState ?? "clean"}</p>
            <p>Status da conta: {profile?.accountStatus ?? "pending"}</p>
          </div>
        </Surface>

        <Button variant="secondary" onClick={() => void handleSignOut()} className="w-full">
          Sair
        </Button>
      </PageFrame>

      <ProfileOnboardingModal
        key={`settings-${profile?.updatedAt ?? "new"}-${editingProfile ? "open" : "closed"}`}
        open={editingProfile}
        mandatory={false}
        profile={profile}
        onClose={() => setEditingProfile(false)}
      />
    </>
  );
}
