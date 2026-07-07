# DOCUMENTAÇÃO DO SISTEMA
# Visual Esquadrias

Versão: 2.1.0

Última atualização:
Julho/2026

---

# Objetivo

O Visual Esquadrias é um sistema simples de controle de estoque desenvolvido para substituir planilhas de Excel.

O foco do sistema é:

- simplicidade;
- rapidez;
- segurança dos dados;
- funcionamento em nuvem através do Supabase.

Todo o desenvolvimento é voltado para uma pequena empresa, evitando funcionalidades desnecessárias de um ERP.

---

# Tecnologias

Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS

Backend

- Supabase

Banco de Dados

- PostgreSQL

Hospedagem

- Vercel

Controle de versão

- Git
- GitHub

---

# Estrutura do Banco

## produtos

Campos

id (BIGINT - Identity)

codigo

descricao

categoria

unidade

quantidade

estoque_minimo

preco_compra

observacao

fornecedor_id

ultima_entrada

---

## fornecedores

id

razao_social

nome_fantasia

categoria

contato

telefone

whatsapp

email

cidade

estado

observacoes

created_at

---

## usuarios

id

nome

login

senha

---

## lixeira

id

produto_id

codigo

descricao

categoria

unidade

quantidade

estoque_minimo

preco_compra

observacao

fornecedor_id

ultima_entrada

data_exclusao

---

# Arquitetura

O sistema NÃO utiliza mais o código do produto como identificador interno.

Toda operação é feita através do campo

id

O código passou a ser apenas uma informação visual.

Isso permite produtos com códigos repetidos.

Exemplo

CON449
Branco

CON449
Preto

São produtos independentes.

---

# Funcionalidades

## Dashboard

Exibe

Quantidade de produtos

Itens abaixo do estoque mínimo

Quantidade de fornecedores

Itens na lixeira

---

## Produtos

Cadastrar produto

Editar produto

Excluir produto

Enviar para lixeira

Pesquisa

Filtro por categoria

Relatório PDF

Ordenação por ordem de cadastro

---

## Entrada

Pesquisar produto

Atualizar estoque

Atualizar fornecedor

Atualizar preço de compra

Atualizar última entrada

Operação realizada por ID

---

## Saída

Pesquisar produto

Baixar estoque

Impedir estoque negativo

Operação realizada por ID

---

## Compras

Lista automática de itens abaixo do estoque mínimo

Filtro por categoria

Relatório PDF

---

## Fornecedores

Cadastro

Edição

Exclusão

Pesquisa

---

## Usuários

Cadastro

Login

Controle básico de acesso

---

## Sistema

Backup

Restauração

---

## Lixeira

Enviar produto excluído

Restaurar

Excluir definitivamente

Mantém o ID original do produto através do campo produto_id

---

# Regras do Sistema

Nunca permitir estoque negativo.

Não permitir edição simultânea de produtos iguais.

Permitir códigos repetidos.

Toda identificação interna utiliza ID.

Código serve apenas para exibição.

---

# Fluxo de Exclusão

Produto

↓

Lixeira

↓

Produto removido da tabela produtos

↓

Produto preservado na lixeira

↓

Restauração

↓

Produto retorna utilizando o ID original.

---

# Fluxo de Entrada

Seleciona produto

↓

Seleciona fornecedor

↓

Informa quantidade

↓

Atualiza estoque

↓

Atualiza fornecedor

↓

Atualiza preço

↓

Atualiza data da última entrada

---

# Fluxo de Saída

Seleciona produto

↓

Informa quantidade

↓

Verifica estoque

↓

Atualiza quantidade

---

# Backup

Objetivo

Permitir recuperar o sistema exatamente como estava.

Estratégia

Backup completo das tabelas

produtos

fornecedores

usuarios

lixeira

Mantendo

IDs

datas

fornecedores

preços

estoques

observações

---

# Estrutura do Projeto

src/

components/

pages/

services/

hooks/

layouts/

types/

assets/

---

# Arquivos principais

ProdutoForm.tsx

ProdutoTable.tsx

BuscaProduto.tsx

Produtos.tsx

Entrada.tsx

Saida.tsx

Compras.tsx

produtoSupabase.ts

fornecedorSupabase.ts

usuarioSupabase.ts

---

# Melhorias já implementadas

Migração completa para utilização de ID.

Correção de produtos com códigos repetidos.

Correção da edição.

Correção da exclusão.

Correção da entrada.

Correção da saída.

Correção das keys do React.

Ordenação por ordem de cadastro.

Lixeira preparada para preservar o ID original.

---

# Melhorias futuras

Backup completo em arquivo JSON.

Restauração completa do sistema.

Logs de movimentação.

Histórico de alterações.

Controle de permissões.

Importação de produtos.

Exportação para Excel.

Controle de inventário.

Controle de compras.

Controle de pedidos.

Relatórios gerenciais.

Dashboard avançado.

---

# Convenções

Nunca utilizar codigo para localizar registros.

Sempre utilizar id.

Toda tabela deverá possuir campo id.

Todo relacionamento deverá utilizar IDs.

---

# Versionamento

2.0

Sistema funcionando.

2.1

Migração completa para identificação por ID.

Correção de produtos duplicados.

Correção de entrada.

Correção de saída.

Correção de exclusão.

Correção da lixeira.

---

# Repositório

GitHub

renatomarinrossi/estoque-visual-esquadrias

---

# Deploy

Vercel

Deploy automático a cada git push.

---

# Objetivo Final

Manter um sistema simples, rápido, seguro e fácil de utilizar, substituindo totalmente as planilhas de estoque, preservando a integridade dos dados e permitindo evolução contínua sem perder a simplicidade.
