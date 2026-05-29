"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Input, StrongSurface } from "@/components/ui/kit";
import { useSocialDirectory } from "@/hooks/use-social-session";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { filterProfilesForSearch } from "@/lib/firebase/social";
import { useAppStore } from "@/store/app-store";

export function SocialScreen() {
  const { profiles } = useSocialDirectory();
  const localProfiles = useStore(useAppStore, (state) => state.profiles);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const socialReady = hasFirebaseConfig();

  const activeProfiles = useMemo(
    () => profiles.filter((item) => item.accountStatus === "active" && item.profileCompleted),
    [profiles],
  );
  const searchResults = useMemo(() => filterProfilesForSearch(activeProfiles, deferredSearch).slice(0, 12), [activeProfiles, deferredSearch]);
  const localResults = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return localProfiles.slice(0, 12);
    }

    return localProfiles.filter((profile) => `${profile.name} ${profile.handle} ${profile.bio}`.toLowerCase().includes(query)).slice(0, 12);
  }, [deferredSearch, localProfiles]);

  return (
    <PageFrame className="gap-4">
      <StrongSurface className="rounded-[28px] p-4 md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou username"
            className="h-13 rounded-[18px] pl-11 text-base"
          />
        </div>

        {socialReady ? (
          <div className="mt-3 space-y-2">
            {searchResults.length === 0 ? (
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-[var(--muted)]">
                Nenhuma pessoa encontrada.
              </div>
            ) : (
              searchResults.map((result) => (
                <Link
                  key={result.id}
                  href={`/social/${result.username.replace(/^@/, "")}`}
                  className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.05]"
                >
                  <img src={result.avatarUrl} alt={result.fullName} className="size-12 rounded-[14px] object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{result.fullName}</p>
                    <p className="truncate text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{result.username}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {localResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.05]"
              >
                <img src={result.avatarImage} alt={result.name} className="size-12 rounded-[14px] object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{result.name}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{result.handle}</p>
                </div>
                <Link href="/profile" className="ml-auto text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                  ver
                </Link>
              </div>
            ))}
          </div>
        )}
      </StrongSurface>
    </PageFrame>
  );
}
