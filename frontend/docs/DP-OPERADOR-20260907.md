# Operador no Departamento Pessoal — 7 de setembro de 2026

Autorizado pelo usuário: Operador tem o mesmo acesso do Gerencial ao DP, inclusive salários, pagamentos, férias, relatórios, calendário e exclusão definitiva de funcionário e registros vinculados. Auditoria permanece exclusiva do Desenvolvedor no banco e na interface. Usuário inativo continua bloqueado. As permissões dos outros módulos não foram ampliadas.

Migration 26 altera somente a função central de autorização. Menu e rota incluem OPERADOR. Testes de banco verificaram consulta, cadastro, baixa, exclusão, auditoria oculta, bloqueio de inativos, restrição de backup e preservação das demais permissões. Testes de banco, lint e build/TypeScript aprovados.

Backup operacional anterior e fonte publicada guardados em `.backups/dp-operador-20260907`, ignorado pelo Git. Publicação direcionada explicitamente ao projeto oficial estoque-visual-esquadrias-tr76. Bundle esperado: `/assets/index-C05w_76C.js`.
