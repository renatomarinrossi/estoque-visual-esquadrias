# Publicação concluída — demonstração, 7 de setembro de 2026

## Estado local

Branch `dev`, alterações anteriores preservadas, sem push. Frontend publicado pela CLI no projeto demo. Backup inicial em `C:\Users\Renato\AppData\Local\Temp\estoque-auditoria-20260907-090656`. Hashes de todas as migrations preexistentes conferidos e idênticos à cópia inicial. As correções estão no diretório de trabalho; não presumir que foram commitadas.

Validações concluídas após as alterações: banco PGlite com todas as migrations e cenários de rollback/RLS; quatro testes automatizados; TypeScript/build; lint; `git diff --check`; auditoria das dependências de produção com zero vulnerabilidades. Build apresenta apenas aviso de importação dinâmica de módulo já importado estaticamente.

Detalhamento e parte adiada do item 31 em `AUDITORIA-20260907.md`; recuperação em `BACKUP.md`. O usuário pediu economia dos limites e autorizou usar um crédito gratuito de renovação, aplicado com sucesso durante esta publicação.

## Destino confirmado

- Vercel: time `estoque2`, projeto `visual-esquadrias-demo`, ID `prj_pIHHsbc6zEm3IU5V34RqGYqwRt1Q`.
- Domínio: `demo.visualesquadrias.com`.
- Supabase demo confirmado no bundle público existente: `jnaojtkggsedzauizxgh`.
- Produção: `ukakbfidmmtkntbftsda`; não modificar.
- CLI Vercel autenticada e `.vercel/project.json` vinculado ao demo. `.vercel` e `.env*` ignorados no Git.
- Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existem na Vercel para Production/Preview do **projeto demo**. São secretas na Vercel e não podem ser baixadas; `.env.demo.local` contém placeholders `[SENSITIVE]`, não serve para build. Usar build remoto com as variáveis existentes. Não exibir credenciais.

## Resultado da publicação

Deploy Vercel `dpl_7dXuwFe7Bw6gb9q9V7odnANCk5PS`, estado `READY`, associado a https://demo.visualesquadrias.com. Build remoto e TypeScript concluídos com sucesso. URL imutável: https://visual-esquadrias-demo-laelkxlpi-estoque2.vercel.app.

Migrations 17–24 aplicadas em transação única pela CLI Supabase, com `--linked --project-ref jnaojtkggsedzauizxgh`. Foi feito ensaio local com cópia dos dados demo antes da execução. As 11 tabelas preexistentes foram comparadas antes/depois no banco remoto e permaneceram idênticas. O histórico anterior foi instalado por SQL, sem registros em `supabase_migrations`; não inferir ausência de atualização pelo painel “No migrations” e não reaplicar esses arquivos.

As funções `autenticar-usuario` e `gerenciar-usuarios` foram publicadas na versão 2 e estão `ACTIVE`, preservando `verify_jwt=true`. Fontes anteriores guardadas no backup abaixo.

`scripts/validar-demo.sql` passou no banco remoto: permissões, proporcional /30, baixa com desconto, calendário, logs financeiros, auditoria DP e geração do backup v6. Todos os registros do ensaio foram revertidos; sequências podem ter avançado. `scripts/validar-publicacao-demo.ps1` confirmou HTTP 200, bundle sem URL de produção, CORS das duas funções e rejeição de login inexistente pela aplicação. A tela de login foi aberta no domínio; não houve teste visual autenticado completo com uma conta do aplicativo.

## Cópias de segurança

Diretório permanente: `C:\Projetos\estoque-visual-esquadrias\frontend\.backups\demo-20260907-auditoria`, ignorado pelo Git e pela Vercel. Cópia de trabalho também em `C:\Users\Renato\AppData\Local\Temp\visual-demo-predeploy-20260907`.

- `dados.json`: backup consistente das 11 tabelas anteriores, com identificação do projeto e data.
- `dados-apos.json`: cópia após migrações, comparada à anterior.
- `dados.csv`: exportação alternativa com XML de cada tabela.
- `esquema.csv`: colunas, constraints, índices, policies, triggers e definições das funções anteriores.
- `supabase/functions`: fontes antigas das Edge Functions.
- `manifesto.json`: hashes de cada migration; `migrations-17-24.sql`: arquivo aplicado, SHA-256 `4138d50a8da079be6f4e0872b87a81b4aac507a98385662d9fb5e6f11e83f01a`.

Essas cópias operacionais não incluem Auth/senhas do Supabase nem substituem backup nativo de infraestrutura. Preservar o diretório fora da limpeza de temporários. Produção não foi alterada.

Em publicações futuras, conferir o vínculo `.vercel/project.json` antes de usar `--prod`: neste diretório ele aponta o domínio principal do projeto **demo**. Não fazer push como substituto; o demo não tem Git conectado e outro projeto pode disparar deploy automático.
