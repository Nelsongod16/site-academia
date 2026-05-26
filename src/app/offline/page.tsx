export default function OfflinePage() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="glass-strong max-w-sm rounded-[26px] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">offline</p>
        <h1 className="mt-3 text-2xl font-semibold">Continuar em modo leve.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          O cache local continua ativo para treinos, feed recente e perfis sociais.
        </p>
      </div>
    </main>
  );
}
