# DOCUMENTAÇÃO DO SISTEMA — VERSÃO 3.5.5

**Sistema:** Estoque Visual Esquadrias  
**Versão:** 3.5.5  
**Última atualização:** 13/08/2026  
**Ambiente:** React, TypeScript, Vite, Tailwind CSS, Supabase e Vercel.

---

## 1. Objetivo do sistema

O Estoque Visual Esquadrias é um sistema interno para controle de estoque e operações financeiras da empresa. A prioridade é manter o uso simples, rápido e seguro, sem transformar o projeto em um ERP complexo.

O sistema utiliza o `id` do banco como identificador interno. O código de produto é apenas informativo e pode se repetir entre produtos diferentes.

---

## 2. Acesso e perfis

O acesso é feito pelo login interno do sistema, com autenticação no Supabase Auth.

- **DESENVOLVEDOR:** acesso completo, incluindo usuários, movimentações de estoque, logs financeiros, backup e restauração.
- **GERENCIAL:** acesso aos recursos operacionais e ao Dashboard Financeiro.
- **Demais usuários:** acesso às operações permitidas pelo perfil, à consulta de sistema, à entrada/saída e ao estoque conforme as telas disponíveis.

A sessão é encerrada quando a aba do sistema é fechada.

---

## 3. Estoque

### Produtos

- Cadastro, edição, exclusão e restauração são feitos pelo `id`.
- Produtos são exibidos em ordem alfabética pela descrição.
- Estoque negativo é permitido propositalmente para evidenciar inconsistências ou saídas indevidas.
- A tela possui busca, colunas organizadas e ações compactas.

### Entradas e saídas

- Toda entrada e saída atualiza o saldo do produto.
- As alterações são registradas em **Movimentações**, tela exclusiva do Desenvolvedor.
- Movimentações preservam produto, quantidade, saldo anterior, saldo resultante, fornecedor quando aplicável, data e usuário.

### Lixeira

- Produtos excluídos podem ser restaurados.
- O ID original é preservado na restauração.

---

## 4. Financeiro

### Arquitetura de vendas

O módulo financeiro segue obrigatoriamente a estrutura:

```text
Venda
  ↓
Parcelas
  ↓
Recebimentos
```

Cada parcela possui valor, vencimento, forma de pagamento e status. Cada parcela pode receber vários recebimentos.

Status automático de parcela:

- Sem recebimento: `A_RECEBER`;
- Recebimento menor que o valor: `PARCIALMENTE_RECEBIDO`;
- Valor totalmente recebido: `RECEBIDO`.

Uma venda fica como `RECEBIDO` apenas quando todas as parcelas estão recebidas. Caso contrário, permanece `A_RECEBER`.

### Formas de pagamento

A forma de pagamento pertence à parcela, não à venda. `CONDICIONADO_ENTREGA` é uma forma de pagamento e pode não possuir vencimento. Parcelas condicionadas são exibidas separadamente em Contas a Receber.

### Vendas

- Cadastro e edição de vendas com parcelas são gravados de forma atômica no banco.
- Há busca por cliente, detalhamento, histórico de recebimentos, edição e exclusão de recebimentos.
- Relatório individual de venda em PDF.
- Vendas totalmente recebidas podem ser movidas para **Obras Finalizadas**.
- Obras Finalizadas podem ser restauradas para a lista normal de vendas.

### Contas a Receber

- Filtro padrão: hoje até os próximos 15 dias.
- Filtros por período, cliente e forma de pagamento.
- Botão para aplicar filtros e retornar ao intervalo padrão.
- Contas atrasadas aparecem sempre em seção própria.
- Condicionados à entrega aparecem em seção própria.
- A seção de demais contas exibe o total a receber conforme o período aplicado.
- Relatório PDF segue os filtros aplicados.

### Contas a Pagar

- Cadastro com favorecido, vencimento, valor e meio de pagamento.
- Meios: PIX, boleto, cheque física e cheque jurídica.
- Confirmação de pagamento registra a data de pagamento e altera o status para `PAGO`.
- Filtro padrão: hoje até os próximos 15 dias, com período livre para consulta e relatório.

### Dashboard Financeiro

Disponível para Gerencial e Desenvolvedor. Mostra resumos e listas de contas a receber e a pagar, com relatório por período.

### Logs Financeiros

Disponível apenas para Desenvolvedor. O log é produzido automaticamente pelo banco para:

- Vendas criadas, alteradas, excluídas, arquivadas e restauradas;
- Parcelas criadas, alteradas, excluídas e com status atualizado;
- Recebimentos registrados, alterados e excluídos;
- Contas a pagar criadas, alteradas, excluídas e pagas.

Por padrão, a tela mostra os últimos dois dias e permite escolher datas específicas. A consulta mostra até 500 registros mais recentes para preservar desempenho.

---

## 5. Sistema, backup e restauração

Todos os usuários podem abrir **Sistema** e consultar:

- Status do Banco de Dados;
- Servidor utilizado;
- Versão e última atualização do sistema.

Somente o Desenvolvedor pode:

- Gerar backup completo em JSON;
- Restaurar backup completo;
- Consultar a data do último backup local.

A restauração substitui dados do sistema e exige confirmação explícita. Antes de restaurar, sempre gere e guarde um backup atual.

---

## 6. Banco de dados e migrações

As principais tabelas são:

- `produtos`, `fornecedores`, `movimentacoes_estoque`, `lixeira`;
- `usuarios`;
- `vendas`, `vendas_parcelas`, `vendas_recebimentos`;
- `contas_pagar`;
- `logs_financeiros`.

As migrações ficam em `supabase/migrations`. Toda migração nova deve ser executada uma única vez no SQL Editor do Supabase e então versionada no Git.

Migrações importantes da versão 3.5.5:

- `20260813_14_obras_finalizadas.sql` — arquivamento seguro de vendas recebidas;
- `20260813_15_logs_financeiros.sql` — auditoria automática de operações financeiras.

---

## 7. Publicação e validação

Antes de publicar uma alteração:

1. Execute `npm run build`;
2. Execute `npm run lint`;
3. Teste manualmente a funcionalidade alterada;
4. Execute as migrações SQL necessárias no Supabase;
5. Faça commit apenas dos arquivos do projeto — nunca inclua `frontend.zip`;
6. Envie a branch `dev` e promova o deploy correto para Production no Vercel.

O domínio principal de produção é `app.visualesquadrias.com`.

---

## 8. Princípios de manutenção

- Sempre usar `id` para operações de dados;
- Não usar código de produto como identificador;
- Evitar alterações grandes sem verificar impacto;
- Manter serviços do Supabase centralizados em `src/services`;
- Preferir operações atômicas para dados financeiros;
- Preservar o comportamento já validado antes de melhorar o visual;
- Não expor chaves, senhas, tokens ou dados de autenticação na documentação ou no Git.

---

## 9. Próximas possibilidades

- Fluxo de caixa;
- Exportação para Excel;
- Relatórios financeiros mais detalhados;
- Indicadores de estoque mínimo no dashboard;
- Inventário e conferência física;
- Permissões mais granulares por tela e operação.

