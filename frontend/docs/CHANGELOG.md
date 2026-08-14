# CHANGELOG

## Versão 3.5.5 — 13/08/2026

### Financeiro

- Vendas, parcelas e recebimentos consolidados na arquitetura Venda → Parcelas → Recebimentos.
- Contas a receber com filtros por período, atrasadas separadas, condicionados à entrega e relatórios em PDF.
- Contas a pagar com confirmação de pagamento, filtros por período e relatórios em PDF.
- Dashboard Financeiro para os perfis Gerencial e Desenvolvedor.
- Obras Finalizadas: vendas totalmente recebidas podem ser arquivadas e restauradas.
- Logs Financeiros para Desenvolvedor, com histórico de vendas, parcelas, recebimentos e contas a pagar.

### Estoque e operação

- Movimentações de estoque disponíveis para Desenvolvedor.
- Produtos e fornecedores organizados visualmente com separação de colunas.
- Produtos ordenados alfabeticamente pela descrição.
- Versão mobile voltada para consulta, entradas e saídas de estoque.

### Sistema e segurança

- Autenticação integrada ao Supabase Auth.
- Sessão encerrada ao fechar a aba do sistema.
- Banco de Dados e Informações do Sistema disponíveis para todos os usuários.
- Backup e restauração mantidos exclusivamente para Desenvolvedor.
- Estrutura de banco e funções SQL versionadas em `supabase/migrations`.

---

## Versão 2.1.0

### Produtos

- Migração completa para identificação por ID.
- Correção da edição de produtos com códigos repetidos.
- Correção da exclusão por ID.
- Correção da entrada de estoque por ID.
- Correção da saída de estoque por ID.
- Correção da busca de produtos.
- Correção das keys do React.
- Ordenação dos produtos pela ordem de cadastro.
- Lixeira preparada para preservar o ID original.

---

## Versão 2.0.0

Primeira versão operacional do sistema.
