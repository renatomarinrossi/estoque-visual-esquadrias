# Controle de Estoque - Visual Esquadrias

# Documentação Oficial do Sistema

---

# Versão

**2.1.0**

Última atualização:

**06/07/2026**

---

# Objetivo

Sistema desenvolvido exclusivamente para uso interno da Visual Esquadrias, com foco em simplicidade, rapidez, segurança e controle completo do estoque.

---

# Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Supabase
- jsPDF
- jspdf-autotable
- html2canvas
- Vercel

---

# Estrutura do Projeto

```
src/

components/
config/
hooks/
pages/
services/
types/

App.tsx
main.tsx
```

---

# Pages

```
Dashboard

Produtos

Entrada

Saída

Compras

Fornecedores

Lixeira

Sistema

Usuários

Login
```

---

# Components

```
dashboard/

produtos/

fornecedores/

usuarios/

sistema/

layout/

auth/

common/

ui/
```

---

# Hooks

```
useUsuario.ts
```

---

# Services

```
produtoSupabase.ts

fornecedorSupabase.ts

usuarioSupabase.ts

sistemaSupabase.ts

backup/

backupService.ts

restaurarBackup.ts
```

---

# Banco de Dados

## produtos

Campos

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
- created_at

---

## fornecedores

Campos

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
- created_at

---

## usuarios

Campos

- id
- nome
- login
- senha
- perfil
- ativo
- created_at

---

## lixeira

Campos

- id
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
- data_exclusao
- created_at

---

# Dashboard

Exibe

- Valor total do estoque
- Total de produtos
- Produtos com estoque baixo
- Total de fornecedores

Atualização automática.

Operadores não visualizam o valor do estoque.

---

# Produtos

Cadastro completo.

Campos

- Código
- Descrição
- Categoria
- Unidade
- Quantidade
- Estoque mínimo
- Preço de compra
- Fornecedor
- Observação
- Última entrada

Funcionalidades

- Cadastro
- Edição
- Exclusão
- Pesquisa
- Busca inteligente
- Filtro por categoria
- Último fornecedor
- Última entrada

---

# Fornecedores

Cadastro completo.

Campos

- Razão Social
- Nome Fantasia
- Categoria
- Contato
- Telefone
- WhatsApp
- Email
- Cidade
- Estado
- Observações

Funcionalidades

- Cadastro
- Edição
- Exclusão
- Pesquisa

---

# Entrada de Estoque

Funcionalidades

- Busca inteligente
- Atualização automática do estoque
- Atualização automática do fornecedor
- Atualização automática do preço
- Atualização da última entrada

---

# Saída de Estoque

Funcionalidades

- Busca inteligente
- Baixa automática
- Validação de estoque insuficiente

---

# Compras

Lista automática dos produtos abaixo do mínimo.

Cálculo

```
Quantidade para comprar

=

Estoque mínimo

-

Quantidade atual
```

Exportação

- PDF

Filtros

- Categoria

---

# Lixeira

Funcionalidades

- Exclusão lógica
- Restauração
- Exclusão definitiva

---

# Sistema

Exibe

- Status do banco
- Último backup
- Versão
- Última atualização

---

# Backup

## Implementado

Backup completo em JSON.

O backup salva:

- Produtos
- Fornecedores
- Usuários
- Lixeira

Informações adicionais

- Sistema
- Empresa
- Versão do sistema
- Backup Version
- Data do backup

Formato

```json
{
  "sistema": "...",
  "empresa": "...",
  "versaoSistema": "...",
  "backupVersion": 1,
  "dataBackup": "...",

  "produtos": [],
  "fornecedores": [],
  "usuarios": [],
  "lixeira": []
}
```

---

## Recuperação

Estrutura preparada.

Ainda não implementada.

---

# Usuários

Perfis

## Desenvolvedor

Acesso total.

Pode acessar

- Dashboard
- Produtos
- Entrada
- Saída
- Compras
- Fornecedores
- Lixeira
- Sistema
- Usuários
- Backup

Também pode visualizar a senha dos usuários através do botão de exibição.

---

## Gerencial

Pode acessar

- Dashboard
- Produtos
- Entrada
- Saída
- Compras
- Fornecedores
- Lixeira
- Sistema

Não possui acesso

- Usuários
- Backup
- Recuperação

---

## Operador

Pode acessar

- Dashboard
- Produtos
- Entrada
- Saída
- Compras
- Fornecedores
- Lixeira

Não possui acesso

- Sistema
- Usuários
- Backup

Não visualiza

- Valor total do estoque

---

# Segurança

Implementado

- Login
- Logout
- Sessão persistente
- Controle de perfis
- Rotas protegidas
- Menu dinâmico
- Controle de permissões
- Usuário não pode inativar a própria conta

---

# Componentes Principais

## BuscaProduto

Busca inteligente reutilizada.

---

## ProtectedRoute

Controle de acesso.

---

## UsuarioForm

Cadastro e edição.

---

## UsuarioTable

Listagem dos usuários.

Funcionalidades

- Editar
- Ativar
- Inativar
- Visualização da senha (somente Desenvolvedor)

---

## BackupCard

Geração do backup.

---

## RestaurarCard

Estrutura preparada para futura recuperação do backup.

---

## BancoCard

Status do banco.

---

## InformacoesCard

Versão do sistema.

Última atualização.

---

# Histórico de Desenvolvimento

Sprint 01

Estrutura inicial

---

Sprint 02

Produtos

---

Sprint 03

Entrada

---

Sprint 04

Saída

---

Sprint 05

Dashboard

---

Sprint 06

Lixeira

---

Sprint 07

Último fornecedor

Última entrada

---

Sprint 08

Categorias

---

Sprint 09

Compras

PDF

---

Sprint 10

Busca inteligente

BuscaProduto reutilizável

---

Sprint 11

Sistema

Status do banco

---

Sprint 12

Backup JSON

---

Sprint 13

Controle de versão

---

Sprint 14

Login

Sessão

Permissões

---

Sprint 15

Usuários

Perfis

ProtectedRoute

Menu dinâmico

---

Sprint 16

Backup completo

Backup com usuários

Versionamento do backup

Visualização da senha para Desenvolvedor

Preparação para futura recuperação de backup

---

# Status Atual

## Funcionando

- Login
- Dashboard
- Produtos
- Fornecedores
- Entrada
- Saída
- Compras
- Lixeira
- Sistema
- Usuários
- Backup
- Controle de permissões
- Sessão persistente

---

# Pendências

- Recuperação de backup
- Alteração de senha
- Recuperação de senha
- Logs
- Auditoria
- Histórico de movimentações
- Dashboard analítico
- Relatórios
- Backup automático
- Autenticação nativa do Supabase

---

# Deploy

Frontend

Vercel

Banco

Supabase

---

# Observações

Sistema desenvolvido exclusivamente para uso interno da Visual Esquadrias.

Projeto focado em simplicidade, organização e controle completo do estoque.

Todo o desenvolvimento é versionado através de Git e hospedado no GitHub, com deploy automático pela Vercel.
