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

## Sincronizar master com descricao

```bash
npm run sync:master -- "descricao do que foi feito"
```

Esse e o fluxo central para qualquer mudanca feita por conversa, agente ou edicao local:

- adiciona tudo com `git add -A`
- cria commit usando a descricao informada
- faz `pull --rebase origin master`
- envia para `origin/master`
- publica na Vercel

A descricao agora e obrigatoria sempre que houver alteracoes locais para commitar.
Se nao houver alteracoes locais, ele apenas sincroniza `master`, envia o que estiver pendente e publica.

Para deixar esse combinado explicito para futuros agentes, o repositorio tambem tem a regra documentada em `AGENTS.md`.

## Auto publicacao pela master

```bash
npm run setup:master-autopublish
```

Esse setup configura o `core.hooksPath` para usar o hook versionado em `.githooks/`.
Depois disso, qualquer novo commit local feito na branch `master` tenta:

- sincronizar a `master` com `origin/master`
- enviar a `master` para o GitHub
- publicar a versao atual na Vercel

Os scripts `publish:master` e `sync:master` continuam disponiveis e usam a mesma rotina central, sem duplicar deploy.

Antes do primeiro uso, rode `vercel login` e `vercel link` para autenticar a CLI e vincular este projeto.

## Observacoes

- O projeto funciona em modo demo com persistencia local.
- Para autenticação e sincronização em tempo real, configure as variáveis `NEXT_PUBLIC_FIREBASE_*`.
