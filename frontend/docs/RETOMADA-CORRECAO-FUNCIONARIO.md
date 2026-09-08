# Correção de funcionário — publicada em 7 de setembro de 2026

Concluída em https://app.visualesquadrias.com, por autorização expressa do usuário.

- Períodos aquisitivos são reconciliados quando a admissão muda. Os períodos anteriores sem férias efetivas ficam marcados como substituídos, preservando seus históricos e saindo dos avisos e saldos atuais. Alterações com férias efetivas exigem revisão. Pagamentos pendentes exigem decisão ao alterar a admissão.
- Corrigido o caso real: admissão 14/08/2026 e período de teste iniciado em 01/05/2025, com todos os movimentos cancelados. Nenhum registro foi apagado nesta publicação.
- Excluir funcionário exige confirmação digitando o nome completo. Conforme instrução explícita do usuário, remove definitivamente cadastro, pagamentos (inclusive quitados), ajustes, férias, períodos e auditorias vinculadas. A operação é atômica; não altera os demais funcionários, estoque ou financeiro externo ao DP. Backups e arquivos anteriores permanecem nas respectivas cópias de segurança.
- Auditoria do DP disponível exclusivamente ao Desenvolvedor na interface e na política RLS. Gerencial mantém o restante do acesso ao DP.
- Item 17 da auditoria original continua proibido por decisão permanente do usuário.

## Validação e publicação

Testes de banco e aplicação, TypeScript, lint e build aprovados. Testados: mudança de admissão, período antigo cancelado, férias efetivas protegidas, confirmação incorreta, exclusão com pagamentos quitados e férias antigas, isolamento de outros dados, rollback após falha no último DELETE, restauração do backup e permissões de Desenvolvedor/Gerencial/Operador. Interface exercitada com dados fictícios, incluindo exclusão e visibilidade da auditoria por perfil.

Ensaio adicional com backup atualizado da produção aprovado. Migration 25 aplicada em transação, com bloqueios, timeout e invariantes que recusariam perda de dados anteriores. Comparação posterior das 21 tabelas aprovada: período anterior marcado como substituído e evento acrescentado na auditoria; demais dados preservados. Produção mantém 1 funcionário, 2 pagamentos e 3 movimentos de férias. Nenhum funcionário real foi excluído para testar.

Deploy Vercel: `dpl_sj8CM1ubK4iqi93Ds3XMbbzPkhdV`, projeto `estoque-visual-esquadrias-tr76`. Versão preparada e conferida antes de promover para o domínio oficial. Bundle confirmado: `/assets/index-BZiGnXab.js`.

Backups de dados/esquema, ensaio, SQL aplicado, fonte publicada e comparação: `.backups/correcao-funcionario-20260907/`, ignorado pelo Git. O diretório `deploy` dentro dessa pasta aponta explicitamente o projeto oficial. O vínculo Vercel do diretório principal permanece na demo.
