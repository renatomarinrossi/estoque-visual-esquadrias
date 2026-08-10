# Backend Supabase

## Estrutura versionada

Os arquivos deste diretório formam a base técnica do Estoque Visual Esquadrias:

- `migrations/20260809_00_estrutura_inicial.sql`: tabelas e relacionamentos;
- `migrations/20260809_09_operacoes_atomicas.sql`: recebimentos e lixeira atômicos;
- `migrations/20260809_10_lixeira_produtos_com_historico.sql`: lixeira compatível com movimentações;
- `migrations/20260809_11_funcoes_estoque_backup_validacoes.sql`: estoque, backup e validações;
- `migrations/20260809_12_gatilhos_e_politicas.sql`: gatilhos e políticas RLS;
- `functions/autenticar-usuario/index.ts`: login por usuário;
- `functions/gerenciar-usuarios/index.ts`: administração de usuários.

## Recuperação em um Supabase novo

1. Crie um projeto Supabase vazio.
2. Execute as migrations em ordem numérica.
3. Crie as Edge Functions com os mesmos nomes e envie os arquivos `index.ts` correspondentes.
4. Configure os secrets da função:
   - `SUPABASE_URL`;
   - `SUPABASE_ANON_KEY`;
   - `SUPABASE_SERVICE_ROLE_KEY`.
5. Crie ou restaure os usuários no Supabase Authentication.
6. Restaure o backup JSON pelo sistema, usando uma conta com perfil `DESENVOLVEDOR`.

## Segurança

- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend ou no Git.
- A chave pública usada pela aplicação pode ficar no frontend; ela depende das políticas RLS para limitar o acesso.
- As funções SQL e Edge Functions conferem usuário ativo e perfil antes das operações sensíveis.

## Banco atual

A migration `20260809_00_estrutura_inicial.sql` é uma referência para reconstrução. Ela não deve ser executada no banco atual, pois as tabelas já existem.

