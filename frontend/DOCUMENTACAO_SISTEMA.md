# Controle de Estoque - Visual Esquadrias

Versão: 1.0.0

Última atualização: Julho/2026

---

# Tecnologias Utilizadas

- React 19
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
- Sistema Online

---

# Produtos

Cadastro completo de produtos.

Campos:

- Código
- Descrição
- Categoria
- Unidade
- Quantidade
- Estoque Mínimo
- Preço de Compra
- Fornecedor Padrão
- Observações

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
- Exclusão para Lixeira
- Pesquisa por código
- Pesquisa por descrição
- Filtro por categoria
- Exibição do último fornecedor
- Exibição da última entrada

---

# Fornecedores

Cadastro completo de fornecedores.

Campos:

- Razão Social
- Nome Fantasia
- Categoria
- Contato
- Telefone
- WhatsApp
- E-mail
- Cidade
- Estado
- Observações

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
- Filtro por categoria
- Visualização detalhada do fornecedor através de expansão da linha
- Componentização da tela

---

# Entrada de Estoque

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

# Saída de Estoque

Funcionalidades:

- Busca inteligente por descrição
- Seleção rápida de produto
- Baixa automática do estoque
- Validação de estoque insuficiente

Componente utilizado:

src/components/produtos/BuscaProduto.tsx

---

# Compras

Lista automática de produtos abaixo do estoque mínimo.

Cálculo:

Quantidade a Comprar =
Estoque Mínimo - Estoque Atual

Funcionalidades:

- Lista automática
- Filtro por categoria
- Separação por categoria
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

# Lixeira

Funcionalidades:

- Armazenamento de produtos excluídos
- Restauração de produtos
- Exclusão definitiva

---

# Banco de Dados

## Tabela produtos

Campos:

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

Campos:

- id
- razao_social
- nome_fantasia
- categoria
- contato
- telefone
- whatsapp
- email
- cidade
- estado
- observacoes

---

## Tabela lixeira

Campos:

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

# Componentes

## Produtos

### BuscaProduto

Arquivo:

src/components/produtos/BuscaProduto.tsx

Responsável por:

- Pesquisa inteligente por descrição
- Lista dinâmica de resultados
- Seleção rápida de produtos
- Reutilizado em Entrada e Saída

---

## Fornecedores

### FornecedorForm

Arquivo:

src/components/fornecedores/FornecedorForm.tsx

Responsável por:

- Cadastro
- Edição
- Validação dos dados do fornecedor

---

### FornecedorTable

Arquivo:

src/components/fornecedores/FornecedorTable.tsx

Responsável por:

- Listagem dos fornecedores
- Botões Editar e Excluir
- Expansão dos detalhes

---

### FornecedorDetalhes

Arquivo:

src/components/fornecedores/FornecedorDetalhes.tsx

Responsável por:

- Exibição completa dos dados do fornecedor
- Razão Social
- Categoria
- Contato
- Telefone
- WhatsApp
- Email
- Cidade
- Estado
- Observações

---

# Histórico de Implementações

## Sprint 01

- Estrutura inicial do projeto
- Integração com Supabase
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

- Lista de Compras
- Geração de PDF da Lista de Compras

## Sprint 10

- Busca inteligente por descrição
- Componente BuscaProduto
- Busca reutilizada em Entrada e Saída
- Filtro por categoria em Produtos
- Inclusão da categoria Borrachas

## Sprint 11

Refatoração completa da tela de Fornecedores.

Componentização da tela:

- FornecedorForm
- FornecedorTable
- FornecedorDetalhes

Melhorias:

- Código organizado
- Componentes reutilizáveis
- Expansão dos detalhes do fornecedor
- Preparação da arquitetura para futuras evoluções

---

# Estrutura Atual do Projeto

```
src/

components/
│
├── produtos/
│   ├── ProdutoForm.tsx
│   ├── ProdutoTable.tsx
│   └── BuscaProduto.tsx
│
├── fornecedores/
│   ├── FornecedorForm.tsx
│   ├── FornecedorTable.tsx
│   └── FornecedorDetalhes.tsx
│
pages/
│
├── Dashboard
├── Produtos
├── Fornecedores
├── Entrada
├── Saída
├── Compras
└── Lixeira
```

---

# Status Atual

## Funcionando

- Dashboard
- Produtos
- Fornecedores
- Entrada
- Saída
- Compras
- Lixeira

---

# Próximas Melhorias

Planejamento atual:

- PDF da tela Produtos
- Histórico de movimentações
- Relatório de Entradas
- Relatório de Saídas
- Relatório por Fornecedor
- Controle de usuários
- Perfis de acesso
- Backup automático
- Auditoria de alterações
- Indicadores financeiros
- Dashboard avançado

---

# Deploy

Frontend

- Vercel

Banco de Dados

- Supabase

---

# Objetivo do Sistema

Sistema desenvolvido para uso interno da Visual Esquadrias.

Objetivos:

- Controlar estoque
- Controlar fornecedores
- Controlar compras
- Registrar entradas e saídas
- Organizar reposições
- Facilitar consultas rápidas
- Manter simplicidade e rapidez no uso

---

# Observações

O sistema foi desenvolvido priorizando:

- Simplicidade
- Facilidade de utilização
- Componentização do código
- Reutilização de componentes
- Facilidade de manutenção
- Escalabilidade para futuras funcionalidades
