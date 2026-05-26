"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Cloud, Smartphone } from "lucide-react";
import { useStore } from "zustand";

import { Button, Input, StrongSurface, Surface } from "@/components/ui/kit";
import { loginWithFirebase } from "@/lib/firebase/auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { useAppStore } from "@/store/app-store";

export function LoginScreen() {
  const router = useRouter();
  const hasHydrated = useStore(useAppStore, (state) => state.hasHydrated);
  const sessionUser = useStore(useAppStore, (state) => state.sessionUser);
  const signInDemo = useStore(useAppStore, (state) => state.signInDemo);
  const signInFirebaseUser = useStore(useAppStore, (state) => state.signInFirebaseUser);
  const [email, setEmail] = useState("lia@pulse.app");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasHydrated && sessionUser) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, router, sessionUser]);

  function enterApp() {
    router.push("/dashboard");
  }

  async function handleFirebaseLogin() {
    try {
      setError("");
      const result = await loginWithFirebase(email, password);
      signInFirebaseUser({ uid: result.user.uid, email: result.user.email });
      enterApp();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Nao foi possivel entrar.");
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <StrongSurface className="flex min-h-[520px] flex-col justify-between rounded-[32px] p-6 md:p-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">pulse studio</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-[-0.08em] md:text-6xl">
              rotina limpa, foco bruto.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
              Academia, corrida, natacao, feed, fotos e evolucao fisica em uma experiencia compacta de app premium.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Surface className="rounded-[24px]">
              <Smartphone className="size-4 text-[var(--accent)]" />
              <p className="mt-3 text-sm font-medium">PWA nativo</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Instalacao, cache e uso rapido no celular.</p>
            </Surface>
            <Surface className="rounded-[24px]">
              <Cloud className="size-4 text-[var(--sky)]" />
              <p className="mt-3 text-sm font-medium">Sync em tempo real</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Pronto para 2 pessoas com Firebase.</p>
            </Surface>
            <Surface className="rounded-[24px]">
              <ArrowRight className="size-4 text-[var(--warn)]" />
              <p className="mt-3 text-sm font-medium">Treino rapido</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Abrir o treino do dia em um toque.</p>
            </Surface>
          </div>
        </StrongSurface>

        <StrongSurface className="rounded-[32px] p-6 md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">entrar</p>
          <div className="mt-6 space-y-3">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" />
            {error ? <p className="text-sm text-[var(--warn)]">{error}</p> : null}
            {hasFirebaseConfig() ? (
              <Button onClick={() => void handleFirebaseLogin()} className="w-full">
                Entrar com Firebase
              </Button>
            ) : (
              <Button
                onClick={() =>
                  startTransition(() => {
                    signInDemo("user-1");
                    enterApp();
                  })
                }
                className="w-full"
              >
                Entrar no modo demo
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() =>
                startTransition(() => {
                  signInDemo("user-2");
                  enterApp();
                })
              }
              className="w-full"
            >
              Entrar como segunda pessoa
            </Button>
          </div>

          <div className="mt-5 rounded-[20px] border border-white/8 bg-white/4 p-4">
            <p className="text-sm font-medium">Modo atual</p>
            <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
              {hasFirebaseConfig()
                ? "Autenticacao real e sincronizacao viva habilitadas."
                : "Interface completa com autosave local e estrutura pronta para Firebase."}
            </p>
          </div>

          <p className="mt-5 text-sm text-[var(--muted)]">
            Novo por aqui?{" "}
            <Link href="/register" className="text-white">
              Criar conta
            </Link>
          </p>
        </StrongSurface>
      </div>
    </main>
  );
}
