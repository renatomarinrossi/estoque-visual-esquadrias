# Publicação (Vercel)

## Antes de enviar

No Git Bash, dentro da pasta `frontend`:

```bash
npm run build
```

O comando precisa terminar com `built`. O aviso sobre arquivos grandes é conhecido e não bloqueia a publicação.

## Enviar alterações para o repositório

```bash
git status
git add src supabase/migrations docs package.json
git commit -m "descrição objetiva da alteração"
git push origin dev
```

Não envie `frontend.zip`, `node_modules` ou arquivos de backup JSON ao repositório.

## Publicar em produção

O projeto trabalha com a branch `dev`.

1. O `git push origin dev` cria um deploy de **Preview** na Vercel.
2. Abra o deploy mais recente na Vercel e confirme que está como **Ready**.
3. Teste o Preview.
4. Use **Promote to Production** para disponibilizar a versão em `app.visualesquadrias.com`.

O envio para `dev` sozinho não atualiza a produção.

## Se o build falhar

1. Leia a primeira mensagem de erro relevante.
2. Corrija localmente.
3. Execute `npm run build` novamente.
4. Faça novo commit e push.

