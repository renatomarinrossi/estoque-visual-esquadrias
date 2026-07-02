# DOCUMENTAÇÃO DO SISTEMA

## Nome do Sistema

Estoque Visual Esquadrias

---

# Tecnologias

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS

Backend:
- Supabase

Hospedagem:
- Vercel

Controle de versão:
- Git
- GitHub

---

# Objetivo

Sistema de controle de estoque para a Visual Esquadrias.

Controle de:

- Produtos
- Entradas
- Saídas
- Fornecedores
- Compras
- Lixeira

---

# Funcionalidades Concluídas

## Login

- Login utilizando Supabase Auth
- Sessão encerrada ao fechar navegador
- Acesso protegido

---

## Dashboard

Exibe:

- Total de produtos
- Produtos abaixo do mínimo
- Valor total do estoque
- Status do sistema

---

## Produtos

Cadastro de:

- Código
- Descrição
- Categoria
- Unidade
- Quantidade
- Estoque mínimo
- Preço de compra
- Último fornecedor
- Observação

Permite:

- Inserir
- Editar
- Excluir

---

## Categorias

Categorias cadastradas:

- Vidros
- Alumínio
- Acessórios
- Ferramentas
- Parafusos/Brocas
- Silicone/PU
- Borrachas

---

## Fornecedores

Cadastro de:

- Razão Social
- Nome Fantasia
- CNPJ
- Telefone
- E-mail
- Observações

Permite:

- Inserir
- Editar
- Excluir

---

## Entrada de Estoque

Permite:

- Selecionar produto
- Selecionar fornecedor
- Informar quantidade
- Informar preço de compra

Atualiza automaticamente:

- Estoque
- Último fornecedor
- Último preço pago
- Data da última entrada

---

## Saída de Estoque

Permite:

- Selecionar produto
- Informar quantidade

Valida:

- Estoque disponível

Atualiza:

- Quantidade em estoque

---

## Compras

Exibe apenas produtos abaixo do estoque mínimo.

Possui:

- Filtro por categoria
- Quantidade sugerida para compra

Fórmula:

Comprar = Estoque Mínimo - Estoque Atual

Exportação:

- PDF por categoria

---

## Lixeira

Ao excluir um produto:

- Produto é movido para lixeira

Permite:

- Restaurar produto
- Excluir definitivamente

---

# Estrutura de Banco

## produtos

Campos principais:

- codigo
- descricao
- categoria
- unidade
- quantidade
- estoque_minimo
- preco_compra
- fornecedor_id
- observacao
- ultima_entrada

---

## fornecedores

Campos principais:

- id
- razao_social
- nome_fantasia
- cnpj
- telefone
- email
- observacao

---

## lixeira

Armazena produtos excluídos.

---

# Padrão de Desenvolvimento

IMPORTANTE:

Sempre enviar arquivos completos.

Não enviar apenas trechos para alteração.

---

# Roadmap

## Sprint 11

Histórico de Compras

Criar tabela:

entradas

Registrar:

- Produto
- Quantidade
- Fornecedor
- Preço
- Data

---

## Sprint 12

Dashboard Inteligente

Adicionar:

- Última entrada
- Itens para compra
- Fornecedor mais utilizado
- Estatísticas

---

## Sprint 13

Relatórios

- Estoque Atual
- Entradas
- Saídas
- Compras
- Fornecedores

---

## Sprint 14

Backup

Exportação Excel.

---

# Última Atualização

Categorias implementadas.

PDF de compras implementado.

Versão estável:
v1.0
