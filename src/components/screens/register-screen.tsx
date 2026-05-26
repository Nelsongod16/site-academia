"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Input, StrongSurface } from "@/components/ui/kit";
import { registerWithFirebase } from "@/lib/firebase/auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { useAppStore } from "@/store/app-store";

export function RegisterScreen() {
  const router = useRouter();
  const signInDemo = useAppStore((state) => state.signInDemo);
  const signInFirebaseUser = useAppStore((state) => state.signInFirebaseUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function enterApp() {
    router.push("/dashboard");
  }

  async function handleRegister() {
    if (!hasFirebaseConfig()) {
      signInDemo("user-1");
      enterApp();
      return;
    }

    try {
      setError("");
      const result = await registerWithFirebase(email, password);
      signInFirebaseUser({ uid: result.user.uid, email: result.user.email });
      enterApp();
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Nao foi possivel criar a conta.");
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4">
      <StrongSurface className="w-full max-w-lg rounded-[32px] p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">cadastro</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Criar acesso limpo.</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Conta pronta para sincronizar feed, treino e evolucao entre dispositivos.</p>
        <div className="mt-6 space-y-3">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" />
          {error ? <p className="text-sm text-[var(--warn)]">{error}</p> : null}
          <Button onClick={() => void handleRegister()} className="w-full">
            {hasFirebaseConfig() ? "Criar conta" : "Abrir demo"}
          </Button>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)]">
          Ja tem conta?{" "}
          <Link href="/" className="text-white">
            Entrar
          </Link>
        </p>
      </StrongSurface>
    </main>
  );
}
