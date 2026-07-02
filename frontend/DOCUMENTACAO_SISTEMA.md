# Controle de Estoque - Visual Esquadrias

## Tecnologias Utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- jsPDF
- jspdf-autotable
- Vercel

---

# Estrutura do Sistema

## Dashboard

Indicadores:

- Total de produtos
- Produtos com estoque baixo
- Sistema online

---

## Produtos

Cadastro completo de produtos.

Campos:

- Código
- Descrição
- Categoria
- Unidade
- Quantidade
- Estoque mínimo
- Preço de compra
- Fornecedor padrão
- Observação

Categorias cadastradas:

- Vidros
- Alumínio
- Acessórios
- Ferramentas
- Parafusos/Brocas
- Silicone/PU
- Borrachas

Funcionalidades:

- Cadastro
- Edição
- Exclusão para lixeira
- Pesquisa por código
- Pesquisa por descrição
- Filtro por categoria
- Exibição do último fornecedor
- Exibição da última entrada

---

## Fornecedores

Cadastro de fornecedores.

Campos:

- Razão Social
- Nome Fantasia
- CNPJ
- Telefone
- E-mail
- Categoria

Categorias:

- Vidros
- Alumínio
- Acessórios
- Ferramentas
- Parafusos/Brocas
- Silicone/PU
- Borrachas

Funcionalidades:

- Cadastro
- Edição
- Exclusão

---

## Entrada de Estoque

Funcionalidades:

- Busca inteligente por descrição
- Seleção rápida de produto
- Atualização automática do estoque
- Atualização automática do fornecedor
- Atualização automática do preço de compra
- Atualização automática da última entrada

Componente utilizado:

src/components/produtos/BuscaProduto.tsx

---

## Saída de Estoque

Funcionalidades:

- Busca inteligente por descrição
- Seleção rápida de produto
- Baixa automática do estoque
- Validação de estoque insuficiente

Componente utilizado:

src/components/produtos/BuscaProduto.tsx

---

## Compras

Lista automática de produtos abaixo do estoque mínimo.

Cálculo:

Quantidade a comprar =
Estoque mínimo - Estoque atual

Funcionalidades:

- Separação por categoria
- Filtro por categoria
- Geração de PDF
- Exportação da lista de compras

Categorias:

- Vidros
- Alumínio
- Acessórios
- Ferramentas
- Parafusos/Brocas
- Silicone/PU
- Borrachas

---

## Lixeira

Funcionalidades:

- Armazenamento de produtos excluídos
- Restauração de produtos
- Exclusão definitiva

---

# Banco de Dados

## Tabela produtos

Campos principais:

- codigo
- descricao
- categoria
- unidade
- quantidade
- estoque_minimo
- preco_compra
- observacao
- fornecedor_id
- ultima_entrada

---

## Tabela fornecedores

Campos principais:

- id
- razao_social
- nome_fantasia
- cnpj
- telefone
- email
- categoria

---

## Tabela lixeira

Campos principais:

- codigo
- descricao
- categoria
- unidade
- quantidade
- estoque_minimo
- preco_compra
- observacao
- fornecedor_id
- ultima_entrada
- data_exclusao

---

# Componentes Criados

## BuscaProduto

Arquivo:

src/components/produtos/BuscaProduto.tsx

Responsável por:

- Pesquisar produtos por descrição
- Exibir lista filtrada
- Selecionar produto rapidamente
- Reutilizado em Entrada e Saída

---

# Histórico de Implementações

## Sprint 01

- Estrutura inicial do projeto
- Integração Supabase
- Cadastro de produtos

## Sprint 02

- Cadastro de fornecedores

## Sprint 03

- Entrada de estoque

## Sprint 04

- Saída de estoque

## Sprint 05

- Dashboard

## Sprint 06

- Lixeira

## Sprint 07

- Último fornecedor
- Última entrada

## Sprint 08

- Categorias de produtos

## Sprint 09

- Lista de compras
- PDF da lista de compras

## Sprint 10

- Busca inteligente por descrição
- Filtro por categoria em Produtos
- Categoria Borrachas
- BuscaProduto reutilizável

---

# Status Atual

Funcionando:

- Dashboard
- Produtos
- Fornecedores
- Entrada
- Saída
- Compras
- Lixeira

---

# Próximas Melhorias

Planejadas:

- PDF da tela Produtos
- Histórico de movimentações
- Relatório de entradas
- Relatório de saídas
- Relatório por fornecedor
- Controle de usuários
- Níveis de acesso
- Backup automático
- Auditoria de alterações

---

# Deploy

Hospedagem:

- Vercel

Banco de Dados:

- Supabase

---

# Observações

Sistema desenvolvido para uso interno da Visual Esquadrias.

Objetivo:

Controlar estoque, compras, fornecedores e movimentações de materiais de forma simples e rápida.
