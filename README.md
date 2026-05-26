# Pulse Studio

App web/PWA mobile-first para rotina de treino, academia, corrida, natacao e evolucao fisica.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- Firebase-ready

## Rodando localmente

```bash
npm install
npm run dev
```

O script `dev` sobe o servidor em `0.0.0.0`, o que ajuda quando a pagina e aberta por outro browser, dispositivo ou ambiente integrado.

## Publicar alteracoes

```bash
npm run publish:master -- "sua mensagem de commit"
```

Esse comando adiciona os arquivos alterados, cria o commit na `master`, faz `pull --rebase`, envia para o GitHub e publica em producao na Vercel.

Antes do primeiro uso, rode `vercel login` e `vercel link` para autenticar a CLI e vincular este projeto.

## Observacoes

- O projeto funciona em modo demo com persistencia local.
- Para autenticação e sincronização em tempo real, configure as variáveis `NEXT_PUBLIC_FIREBASE_*`.
