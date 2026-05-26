import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

import { getFirebaseServices } from "@/lib/firebase/client";

export async function loginWithFirebase(email: string, password: string) {
  const services = getFirebaseServices();

  if (!services) {
    throw new Error("Firebase nao configurado.");
  }

  return signInWithEmailAndPassword(services.auth, email, password);
}

export async function registerWithFirebase(email: string, password: string) {
  const services = getFirebaseServices();

  if (!services) {
    throw new Error("Firebase nao configurado.");
  }

  return createUserWithEmailAndPassword(services.auth, email, password);
}

export async function logoutFromFirebase() {
  const services = getFirebaseServices();

  if (!services) {
    return;
  }

  await signOut(services.auth);
}

export function watchFirebaseAuth(callback: (payload: { uid: string; email: string | null } | null) => void) {
  const services = getFirebaseServices();

  if (!services) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(services.auth, (user) => {
    callback(user ? { uid: user.uid, email: user.email } : null);
  });
}
