"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "zustand";

import { Button, Input, StrongSurface } from "@/components/ui/kit";
import { loginWithFirebase, loginWithLocalAccount } from "@/lib/firebase/auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { useAppStore } from "@/store/app-store";

export function LoginScreen() {
  const [{ pendingEmail, checkEmail }] = useState(() => {
    if (typeof window === "undefined") {
      return { pendingEmail: "", checkEmail: false };
    }

    const searchParams = new URLSearchParams(window.location.search);
    return {
      pendingEmail: searchParams.get("email") ?? "",
      checkEmail: searchParams.get("checkEmail") === "1",
    };
  });
  const signInFirebaseUser = useStore(useAppStore, (state) => state.signInFirebaseUser);
  const signInLocalUser = useStore(useAppStore, (state) => state.signInLocalUser);
  const [email, setEmail] = useState(pendingEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFirebaseLogin() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let shouldCompleteProfile = false;

      if (hasFirebaseConfig()) {
        const result = await loginWithFirebase(email, password);
        signInFirebaseUser({ uid: result.user.uid, email: result.user.email, emailVerified: result.user.emailVerified });
      } else {
        const sessionUser = await loginWithLocalAccount(email, password);
        signInLocalUser(sessionUser);
        shouldCompleteProfile = sessionUser.profileCompleted !== true;
      }

      setSuccess("Conta autenticada. Abrindo o app.");
      window.location.replace(shouldCompleteProfile ? "/profile?completeProfile=1" : "/feed");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Nao foi possivel entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(4,6,9,0.62) 0%, rgba(4,6,9,0.82) 48%, rgba(4,6,9,0.94) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=80')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[6px]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(156,255,121,0.12),transparent_26%),radial-gradient(circle_at_85%_8%,rgba(79,209,255,0.12),transparent_22%)]" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <StrongSurface className="rounded-[32px] p-6 md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">entrar</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white md:text-4xl">Comece sua jornada</h1>

          <div className="mt-6 space-y-3">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" />
            {checkEmail ? (
              <p className="text-sm text-[#9CFF79]">
                Conta criada para {pendingEmail ?? "seu e-mail"}. Confirme o e-mail recebido antes de entrar.
              </p>
            ) : null}
            {success ? <p className="text-sm text-[#9CFF79]">{success}</p> : null}
            {error ? <p className="text-sm text-[var(--warn)]">{error}</p> : null}
            <Button onClick={() => void handleFirebaseLogin()} className="w-full" disabled={loading || !email.trim() || !password.trim()}>
              {loading ? "Entrando..." : hasFirebaseConfig() ? "Entrar com conta online" : "Entrar com conta local"}
            </Button>
            <Link href="/register" className="block">
              <Button variant="secondary" className="w-full">
                Criar conta
              </Button>
            </Link>
          </div>
        </StrongSurface>
      </div>
    </main>
  );
}
