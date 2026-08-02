# FINANCEIRO.md

# Visual Esquadrias

## Objetivo

Criar um módulo financeiro simples, integrado ao Visual Esquadrias, mantendo a filosofia do projeto:

- Simplicidade
- Facilidade de uso
- Rapidez
- Estabilidade

O objetivo NÃO é criar um ERP.

O financeiro deve atender às necessidades reais da empresa sem adicionar burocracia.

---

# Situação

Este módulo está sendo desenvolvido na branch:

dev

Não deve ser disponibilizado na produção até sua conclusão.

---

# Estrutura Inicial

O módulo será dividido em duas áreas principais:

- Vendas (Contas a Receber)
- Contas a Pagar

Posteriormente poderão existir novos módulos financeiros.

---

# Vendas

Responsável pelo controle de tudo o que a empresa vendeu.

Cada venda representa um valor que deverá entrar no caixa.

Campos previstos

- id
- data_venda
- cliente
- valor
- forma_pagamento
- data_prevista_recebimento
- responsavel
- status
- observacoes
- created_at

---

## Formas de pagamento

Valores previstos

- PIX
- DINHEIRO
- CARTAO
- BOLETO
- CHEQUE
- CONDICIONADO_ENTREGA

A data de recebimento será informada manualmente pelo usuário.

O sistema não calculará automaticamente prazos.

---

## Status

- A_RECEBER
- RECEBIDO
- CANCELADO

---

# Contas a Pagar

Responsável pelo controle de todas as despesas da empresa.

Campos previstos

- id
- data_lancamento
- favorecido
- descricao
- valor
- forma_pagamento
- data_vencimento
- status
- observacoes
- created_at

---

## Status

- EM_ABERTO
- PAGO
- CANCELADO

---

# Relatórios

O sistema deverá permitir gerar PDF de:

## Vendas

Filtros

- Período inicial
- Período final

Mostrar

- Cliente
- Data
- Valor
- Forma de pagamento
- Status

Totais

- Total recebido
- Total pendente

---

## Contas a pagar

Filtros

- Período inicial
- Período final

Mostrar

- Favorecido
- Data
- Valor
- Forma de pagamento
- Status

Totais

- Total pago
- Total em aberto

---

# Dashboard Financeiro

Planejado para uma segunda etapa.

Indicadores previstos

- Receber hoje
- Pagar hoje
- Recebido no mês
- Pago no mês
- Saldo previsto

---

# Integrações Futuras

Compras

Uma compra poderá gerar automaticamente uma conta a pagar.

Vendas

Uma venda poderá gerar automaticamente uma conta a receber.

---

# Filosofia

O módulo financeiro deve permanecer simples.

Toda funcionalidade deve ser realmente útil.

Evitar recursos desnecessários.

Priorizar rapidez e estabilidade.

---

# Status do Desenvolvimento

## Concluído

Nenhuma funcionalidade implementada.

---

## Em desenvolvimento

Planejamento da estrutura.

---

## Próximas etapas

1. Criar tabelas do banco.
2. Criar tipos TypeScript.
3. Criar services.
4. Criar telas.
5. Criar listagens.
6. Criar edição.
7. Criar exclusão.
8. Criar relatórios PDF.
9. Criar dashboard.
10. Integrar com Compras.

---

# Observações

Toda alteração deve preservar a arquitetura atual do Visual Esquadrias.

Sempre trabalhar na branch dev.

Somente realizar merge para a main quando o módulo estiver completamente testado.

