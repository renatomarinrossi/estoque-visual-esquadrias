# Busca de vendas por nome ou cidade — 7 de setembro de 2026

O mesmo campo busca trechos do nome do cliente ou da cidade, sem diferenciar maiúsculas de minúsculas. Aplica-se a Vendas e Obras Finalizadas. O filtro é aplicado no servidor antes das páginas de 50 registros, mantendo o filtro de arquivamento e a ordenação. Removido o filtro redundante no navegador que descartaria resultados encontrados somente pela cidade. Pesquisa vazia lista normalmente; nomes e cidades com caracteres especiais são tratados como texto.

Validados filtros com espaços, acentos, vírgulas, parênteses, aspas, porcentagem, sublinhado e barras. Testes existentes, lint e build/TypeScript aprovados. Nenhuma migration ou alteração dos dados do banco necessária.

Destino: app.visualesquadrias.com, projeto Vercel estoque-visual-esquadrias-tr76. Fonte preparada em `.backups/busca-venda-cidade-20260907/deploy`, com vínculo explícito ao projeto oficial. Versão anterior preservada no commit 7dd84fb e no deploy anterior. Bundle esperado: `/assets/index-Bc9bboFD.js`.

Publicação concluída: deploy dpl_5957br6XiuqQoiMwQuq1v3DGYdfj, READY, domínio oficial e bundle de vendas conferidos após a publicação.
