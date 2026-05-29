"use client";

import Link from "next/link";
import { Ban, Check, UserPlus, UserRoundCheck, X } from "lucide-react";

import { Button } from "@/components/ui/kit";
import type { SocialProfile, SocialRelationshipState, SocialStats } from "@/types/social";

function primaryActionLabel(relationship: SocialRelationshipState) {
  if (relationship.isFriend) {
    return "Amigos";
  }

  if (relationship.outgoingPending) {
    return "Solicitado";
  }

  if (relationship.incomingPending) {
    return "Aceitar";
  }

  return "Adicionar";
}

export function SocialUserCard({
  profile,
  stats,
  relationship,
  onPrimaryAction,
  onSecondaryAction,
  onBlock,
}: {
  profile: SocialProfile;
  stats?: SocialStats | null;
  relationship: SocialRelationshipState;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  onBlock?: () => void;
}) {
  const primaryLabel = primaryActionLabel(relationship);

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/8 bg-[#090d13]">
      <div className="relative h-72">
        <img src={profile.avatarUrl} alt={profile.fullName} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,10,0.08)_0%,rgba(4,7,10,0.28)_44%,rgba(4,7,10,0.92)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 space-y-4 p-4">
          <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold tracking-[-0.05em]">{profile.fullName}</p>
                <p className="mt-1 truncate text-xs uppercase tracking-[0.2em] text-white/64">{profile.username}</p>
              </div>
              <div className="rounded-full bg-black/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/68">
                {profile.city}, {profile.country}
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/74">{profile.bio || profile.fitnessGoal}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[16px] bg-black/28 px-2 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/56">meta</p>
                <p className="mt-2 text-xs text-white/82">{profile.fitnessGoal}</p>
              </div>
              <div className="rounded-[16px] bg-black/28 px-2 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/56">streak</p>
                <p className="mt-2 text-lg font-semibold">{stats?.currentStreak ?? 0}</p>
              </div>
              <div className="rounded-[16px] bg-black/28 px-2 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/56">posts</p>
                <p className="mt-2 text-lg font-semibold">{stats?.postsCount ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={relationship.isFriend || relationship.incomingPending ? "primary" : "secondary"} onClick={onPrimaryAction} className="flex-1">
              {relationship.isFriend ? <UserRoundCheck className="mr-2 size-4" /> : relationship.incomingPending ? <Check className="mr-2 size-4" /> : <UserPlus className="mr-2 size-4" />}
              {primaryLabel}
            </Button>
            {onSecondaryAction ? (
              <Button variant="ghost" onClick={onSecondaryAction} className="px-4">
                {relationship.incomingPending ? <X className="size-4" /> : "Abrir"}
              </Button>
            ) : (
              <Link href={`/social/${profile.username.replace(/^@/, "")}`} className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-white/7 px-4 text-sm font-medium transition hover:bg-white/12">
                Abrir
              </Link>
            )}
            {onBlock ? (
              <Button variant="ghost" onClick={onBlock} className="px-4 text-[var(--warn)]">
                <Ban className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
