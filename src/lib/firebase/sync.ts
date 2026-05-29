import { getSupabaseClient } from "@/lib/firebase/client";
import type { SharedSnapshot } from "@/types/app";

function mapSnapshotRow(row: { data: SharedSnapshot | null } | null) {
  return row?.data ?? null;
}

export function subscribeSharedSnapshot(userId: string, callback: (snapshot: SharedSnapshot | null) => void) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    callback(null);
    return () => undefined;
  }

  const fetchCurrent = async () => {
    const { data } = await supabase.from("user_snapshots").select("data").eq("user_id", userId).maybeSingle();
    callback(mapSnapshotRow(data as { data: SharedSnapshot | null } | null));
  };

  void fetchCurrent();

  const channel = supabase
    .channel(`user-snapshot-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "user_snapshots", filter: `user_id=eq.${userId}` }, () => {
      void fetchCurrent();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function saveSharedSnapshot(userId: string, snapshot: SharedSnapshot) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("user_snapshots").upsert(
    {
      user_id: userId,
      data: snapshot,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
