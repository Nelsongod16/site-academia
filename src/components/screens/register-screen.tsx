"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Input, StrongSurface } from "@/components/ui/kit";
import { registerWithFirebase, registerWithLocalAccount } from "@/lib/firebase/auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { useAppStore } from "@/store/app-store";

export function RegisterScreen() {
  const router = useRouter();
  const signInFirebaseUser = useAppStore((state) => state.signInFirebaseUser);
  const signInLocalUser = useAppStore((state) => state.signInLocalUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleRegister() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (hasFirebaseConfig()) {
        const result = await registerWithFirebase(email, password);

        if (result.requiresEmailConfirmation) {
          if (typeof window !== "undefined") {
            window.location.assign(`/?checkEmail=1&email=${encodeURIComponent(email)}`);
            return;
          }

          router.replace(`/?checkEmail=1&email=${encodeURIComponent(email)}`);
          return;
        }

        signInFirebaseUser({ uid: result.user.uid, email: result.user.email, emailVerified: result.user.emailVerified });
      } else {
        const sessionUser = await registerWithLocalAccount(email, password);
        signInLocalUser(sessionUser);
      }

      setSuccess("Conta criada com sucesso. Abrindo o app.");
      router.replace("/feed");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Nao foi possivel criar a conta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4">
      <StrongSurface className="w-full max-w-lg rounded-[32px] p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">cadastro</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Criar acesso limpo.</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Conta pronta para sincronizar treino, perfil social, amizades e notificacoes entre dispositivos.</p>
        <div className="mt-6 space-y-3">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" />
          {success ? <p className="text-sm text-[#9CFF79]">{success}</p> : null}
          {error ? <p className="text-sm text-[var(--warn)]">{error}</p> : null}
          <Button onClick={() => void handleRegister()} className="w-full" disabled={saving || !email.trim() || password.trim().length < 6}>
            {saving ? "Criando..." : "Criar conta"}
          </Button>
        </div>
        {hasFirebaseConfig() ? (
          <p className="mt-4 text-xs leading-6 text-[var(--muted)]">
            Conta online com dados sincronizados entre dispositivos e pronta para liberar feed, treinos e perfil real.
          </p>
        ) : (
          <p className="mt-4 text-xs leading-6 text-[var(--muted)]">Sem Firebase, a conta sera criada e guardada no armazenamento local do navegador para voce entrar de verdade no app.</p>
        )}
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
