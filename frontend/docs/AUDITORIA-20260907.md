# Correções da auditoria — 7 de setembro de 2026

Branch `dev`, com alterações locais preservadas. Backup inicial: `C:\Users\Renato\AppData\Local\Temp\estoque-auditoria-20260907-090656`. Migrations anteriores preservadas; mudanças de esquema nas novas migrations 22, 23 e 24. Publicação autorizada somente no projeto Vercel `visual-esquadrias-demo`.

| Item   | Implementação                                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Backup v6 inclui entradas, movimentações e auditorias; restauração transacional sem cascade, com validação e cópia anterior.                             |
| 5      | Calendário de Fernandópolis/SP persistido e editável, aplicado ao quinto dia útil e vencimentos de salários abertos. Baixas preservadas.                 |
| 6–7    | Proporcional /30, admissão/término limitam a competência; revisão explícita de pagamentos pendentes ao inativar ou pelo formulário.                      |
| 8–10   | Tipos de férias separam dias/dinheiro; migração única de registros estruturados; arquivo antigo somente leitura. Descrições livres marcadas como Legado. |
| 12     | Créditos/descontos imutáveis com descrição, idempotência e total não negativo. Ajuste e baixa na mesma transação.                                        |
| 13–14  | Seleção de vencidos corrigida; PDF identifica Todos e cancelados.                                                                                        |
| 15, 18 | Auditoria própria do DP; falha de log financeiro aborta a transação.                                                                                     |
| 19     | Exportação e confirmação de arquivo para retenção, sem expurgo automático.                                                                               |
| 20     | Contas e operações diretas de venda usam RPCs validadas; escrita direta revogada.                                                                        |
| 22     | CORS permite origens explícitas de produção, demo e desenvolvimento.                                                                                     |
| 24     | Falha transitória de perfil preserva sessão e permite nova tentativa.                                                                                    |
| 26     | Dependências atualizadas, Node >=22.12, auditoria npm sem vulnerabilidades na verificação.                                                               |
| 29     | DP separado por abas, formulários, relatórios, configuração e arquivo.                                                                                   |
| 31     | Paginação/filtros no servidor em vendas, logs e movimentações; resumo de vendas agregado. DP carrega lotes para evitar truncamento.                      |
| 32–34  | Histórico de backup no servidor, conversão de versões antigas e procedimento de recuperação separado do Auth.                                            |

## Regras e validação

Divisor salarial 30 confirmado pelo usuário; mês integral preserva salário integral. Calendário 2026–2036, com sábado na contagem e antecipação do vencimento que cair em sábado/domingo/feriado. Fora do intervalo, o banco exige revisão do calendário. Confira eventuais alterações municipais antes da folha.

Referências: [22 de maio municipal](https://fernandopolis.sp.gov.br/o-que-abre-e-o-que-fecha-no-feriado-e-final-de-semana), [Corpus Christi](https://fernandopolis.sp.gov.br/noticias/geral/o-que-abre-e-o-que-fecha-no-corpus-christi-em-fernandopolis), [9 de julho estadual](https://www.al.sp.gov.br/norma/9458), [20 de novembro nacional](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14759.htm).

`npm run test:db` aplica todas as migrations em PGlite com identidades simuladas para RLS. Exercita proporcional, descontos, idempotência, inativação, férias, auditoria obrigatória, round-trip de todas as tabelas do backup, rollback por FK, vínculos Auth e restrições de operador. Não substitui validação remota ou ensaio de concorrência com múltiplas conexões.

`npm test` cobre próxima parcela, backup, conversão v3 e CORS. `npm run build` inclui TypeScript; `npm run lint` verifica o projeto. Interface exercitada localmente com dados simulados, sem baixar pagamentos reais.

## Adiado para preservar a entrega

Paginação integral do DP e das demais telas financeiras/resumos e melhorias adicionais de acabamento ficam para depois. O item 31 está atendido nas três listagens citadas, não em todas as consultas. Movimentos antigos de descrição livre exigem classificação humana; não é seguro inferir dias/dinheiro pelo texto.

Antes de publicar: backup remoto, migrations e Edge Functions no banco demo, variáveis de build e smoke test no domínio. A autorização não abrange mudanças em produção. Veja [BACKUP.md](BACKUP.md) para recuperação e limitações dos formatos antigos.

## Decisão permanente do usuário — item 17

O item 17 da auditoria original (tornar o código do produto único no banco) foi rejeitado expressamente pelo usuário. Não deve ser implementado nem tratado como pendência. Códigos de produtos repetidos devem continuar permitidos; não criar restrição ou índice de unicidade nem bloquear repetições na interface como execução deste item. Esta decisão só pode ser revista por nova instrução explícita do usuário.
