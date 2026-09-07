# Publicação oficial — 7 de setembro de 2026

Autorizada pelo usuário após esclarecimento sobre backups e preservação de dados. Concluída em https://app.visualesquadrias.com.

## Versões e destinos

- Vercel: `estoque2/estoque-visual-esquadrias-tr76`, projeto `prj_b4bsVsw2ZKMGU8zptr50Gzqp362q`, diretório configurado `frontend`.
- Deploy: `dpl_CtqEV2oVvF12GDQNrUH8byYVb4Fs`, estado READY. URL: https://estoque-visual-esquadrias-tr76-dphinrizg-estoque2.vercel.app.
- Bundle confirmado no domínio: `/assets/index-CgpvbuV7.js`, apontando para `ukakbfidmmtkntbftsda.supabase.co`.
- Banco: apenas migrations 22, 23 e 24 foram necessárias. As etapas 17–21 já estavam presentes. Aplicação em transação única, com bloqueio de escrita durante a verificação, timeout e invariantes que abortariam a operação em caso de perda/alteração não prevista.
- Edge Functions: `autenticar-usuario` v2, ACTIVE, `verify_jwt=false`; `gerenciar-usuarios` v5, ACTIVE, `verify_jwt=true`. Configurações de autenticação anteriores preservadas.

O frontend foi compilado com `--prod --skip-domain`, conferido antes da mudança do banco e promovido depois do sucesso das migrations. A produção anterior continua identificada por https://estoque-visual-esquadrias-tr76-42ch7r0ob-estoque2.vercel.app. Não promover a versão anterior cegamente: o frontend antigo pode depender de funções/escritas que foram substituídas na auditoria.

## Preservação e validação

Backup anterior e posterior comparados nas 17 tabelas existentes. Nenhum registro anterior foi perdido ou alterado. Conferidos, entre outros: 105 produtos, 30 fornecedores, 50 vendas, 235 parcelas, 131 recebimentos, 118 contas a pagar, 1.317 logs financeiros, 6 usuários e os registros do DP.

Os dois movimentos antigos de férias mantiveram seus dados; foi acrescentada a representação estruturada de uma programação antiga cancelada, também cancelada no novo histórico. Os extras existentes foram copiados para o livro de ajustes. Nenhum pagamento real foi baixado ou criado durante as verificações de produção.

Validações concluídas:

- Ensaio local das migrations com dados e funções copiados do banco oficial.
- Invariantes de preservação executadas dentro da transação remota e comparação externa após a conclusão.
- Testes automatizados, TypeScript, lint e build Vercel aprovados.
- Consultas do DP, ajustes, resumo de 50 vendas e calendário sob papel autenticado; escrita direta de contas negada.
- HTTP 200 e bundle exato no domínio; CORS das duas funções e rejeição de usuário inexistente no login.
- Backup operacional v6 das 21 tabelas gerado e aceito pelo validador da aplicação.

A interface de login foi aberta no domínio. Não foi realizado percurso visual completo autenticado com a conta pessoal do usuário. Paginação complementar e acabamento adiados permanecem descritos em `AUDITORIA-20260907.md`.

## Backups e continuidade

Pasta permanente, ignorada pelo Git e pela Vercel:
`C:\Projetos\estoque-visual-esquadrias\frontend\.backups\producao-20260907-auditoria`.

- `antes.json`: dados anteriores, colunas, funções, constraints, índices, policies, triggers, permissões e sequências.
- `depois.json` e `comparacao.json`: verificação posterior.
- `backup-operacional-v6.json`: arquivo no formato importável da aplicação; geração registrada no servidor.
- `supabase/functions`: fontes antigas das duas funções.
- `migrations-22-24.sql`, `manifesto.json`: SQL aplicado e hashes.
- `ensaio.mjs`, `comparar.mjs`, `validar.sql`, `validar-http.ps1`: procedimentos executados.
- `deploy/frontend`: cópia do código usada na publicação; `.vercel/project.json` dessa pasta de deploy aponta o projeto oficial.

Backups operacionais não incluem credenciais do Supabase Auth nem substituem recuperação nativa de infraestrutura; veja `BACKUP.md`. Não restaurar o backup da demo sobre produção. Não apagar essa pasta de backup sem guardar outra cópia segura.

O trabalho continua na branch local `dev`, preservando as alterações anteriores, sem commit/push nesta publicação. A publicação usou uma cópia isolada pela CLI. O `.vercel/project.json` da pasta principal continua ligado à demo; para o oficial, usar o diretório de deploy indicado acima ou vincular explicitamente o projeto correto. Não executar deploy/push automático sem conferir o destino e a compatibilidade entre frontend e migrations.
