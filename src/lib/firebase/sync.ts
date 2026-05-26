import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirebaseServices } from "@/lib/firebase/client";
import type { SharedSnapshot } from "@/types/app";

const ROOM_ID = "pulse-shared-room";

export function subscribeSharedSnapshot(callback: (snapshot: SharedSnapshot | null) => void) {
  const services = getFirebaseServices();

  if (!services) {
    callback(null);
    return () => undefined;
  }

  const ref = doc(services.db, "spaces", ROOM_ID);
  return onSnapshot(ref, (snapshot) => callback(snapshot.exists() ? (snapshot.data() as SharedSnapshot) : null));
}

export async function saveSharedSnapshot(snapshot: SharedSnapshot) {
  const services = getFirebaseServices();

  if (!services) {
    return;
  }

  const ref = doc(services.db, "spaces", ROOM_ID);
  await setDoc(ref, { ...snapshot, updatedAt: serverTimestamp() }, { merge: true });
}
