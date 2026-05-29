# Instrucoes Para Agentes

## Publicacao obrigatoria

Sempre que uma conversa, automacao ou agente fizer alteracoes intencionais neste projeto, finalize usando:

```bash
npm run sync:master -- "descricao objetiva da alteracao"
```

Esse e o fluxo padrao obrigatorio para salvar e publicar mudancas. Ele:

- adiciona os arquivos alterados
- cria o commit com a descricao informada
- faz `pull --rebase origin master`
- faz `push origin master`
- publica a versao atual na Vercel

## Cuidados

- Use uma descricao curta e clara do que mudou.
- Rode esse fluxo apenas quando estiver na branch `master`.
- Se houver alteracoes locais de outra pessoa ou de outra tarefa misturadas no mesmo working tree, nao publique tudo junto sem revisar o escopo antes.
