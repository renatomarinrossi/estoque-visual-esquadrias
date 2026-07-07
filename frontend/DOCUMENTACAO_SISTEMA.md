# Controle de Estoque - Visual Esquadrias

## Versão

**2.0.0**

Última atualização:

**06/07/2026**

---

# Tecnologias Utilizadas

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

# Objetivo

Sistema desenvolvido para controle de estoque da Visual Esquadrias, permitindo o gerenciamento completo de produtos, fornecedores, compras, movimentações, usuários e permissões de acesso.

---

# Estrutura do Sistema

## Dashboard

Indicadores:

- Valor total do estoque
- Total de produtos
- Produtos com estoque baixo
- Total de fornecedores

Funcionalidades:

- Atualização automática
- Cálculo do valor do estoque
- Ocultação do valor do estoque para Operadores

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
- Observações
- Última entrada

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
- Exclusão para lixeira
- Pesquisa por código
- Pesquisa por descrição
- Busca inteligente
- Filtro por categoria
- Exibição do último fornecedor
- Exibição da última entrada

---

## Fornecedores

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
- Pesquisa

---

## Entrada de Estoque

Funcionalidades:

- Busca inteligente por descrição
- Seleção rápida do produto
- Atualização automática do estoque
- Atualização automática do fornecedor
- Atualização automática do preço de compra
- Atualização automática da última entrada

---

## Saída de Estoque

Funcionalidades:

- Busca inteligente por descrição
- Seleção rápida do produto
- Baixa automática do estoque
- Validação de estoque insuficiente

---

## Compras

Lista automática de produtos abaixo do estoque mínimo.

Cálculo:

Quantidade a comprar =

Estoque mínimo - Estoque atual

Funcionalidades:

- Separação por categoria
- Filtro por categoria
- Exportação para PDF
- Lista automática de compras

---

## Lixeira

Funcionalidades:

- Armazenamento de produtos excluídos
- Restauração
- Exclusão definitiva

---

## Sistema

Módulo administrativo.

Informações exibidas:

- Status do banco
- Último backup
- Versão do sistema
- Última atualização

Funcionalidades:

- Backup completo do sistema
- Download do backup em JSON
- Restauração de backup (estrutura preparada)

Acesso:

- Desenvolvedor

---

## Usuários

Controle completo dos usuários do sistema.

Campos:

- Nome
- Login
- Senha
- Perfil
- Status

Funcionalidades:

- Cadastro
- Edição
- Ativar usuário
- Inativar usuário
- Controle de perfis
- Login integrado
- Logout
- Sessão persistente

---

# Controle de Permissões

## Desenvolvedor

Possui acesso total.

Pode acessar:

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
- Restaurar Backup

---

## Gerencial

Pode acessar:

- Dashboard
- Produtos
- Entrada
- Saída
- Compras
- Fornecedores
- Lixeira
- Sistema

Restrições:

- Não possui acesso ao Backup
- Não possui acesso ao Restaurar Backup
- Não possui acesso ao módulo Usuários

---

## Operador

Pode acessar:

- Dashboard
- Produtos
- Entrada
- Saída
- Compras
- Fornecedores
- Lixeira

Restrições:

- Não visualiza o valor total do estoque
- Não possui acesso ao Sistema
- Não possui acesso ao módulo Usuários
- Não possui acesso ao Backup
- Não possui acesso ao Restaurar Backup

---

# Banco de Dados

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
- categoria
- contato
- telefone
- whatsapp
- email
- cidade
- estado
- observacoes

---

## usuarios

Campos:

- id
- nome
- login
- senha
- perfil
- ativo

Perfis:

- DESENVOLVEDOR
- GERENCIAL
- OPERADOR

---

## lixeira

Campos:

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

---

# Segurança

Implementações:

- Login por usuário
- Controle de sessão
- Logout
- Rotas protegidas
- Controle de permissões
- Ocultação automática de menus
- Usuário não pode inativar a própria conta

---

# Estrutura do Projeto

## Pages

```
pages/

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

## Components

```
components/

dashboard
produtos
fornecedores
usuarios
sistema
auth
layout
common
ui
```

---

## Hooks

```
hooks/

useUsuario.ts
```

---

## Services

```
services/

produtoSupabase.ts
fornecedorSupabase.ts
usuarioSupabase.ts
sistemaSupabase.ts
backup/
```

---

## Types

```
types/

produto.ts
fornecedor.ts
usuario.ts
```

---

## Config

```
config/

system.ts
```

---

# Componentes Desenvolvidos

## BuscaProduto

Responsável por:

- Pesquisa inteligente
- Reutilização em Entrada e Saída

---

## ProtectedRoute

Responsável por:

- Proteger rotas
- Validar perfil do usuário
- Bloquear acessos não autorizados

---

## UsuarioForm

Responsável por:

- Cadastro
- Edição de usuários

---

## UsuarioTable

Responsável por:

- Listagem
- Ativação
- Inativação
- Edição

---

## BackupCard

Responsável por:

- Execução do backup

---

## RestaurarCard

Estrutura preparada para futura restauração.

---

## BancoCard

Responsável por:

- Mostrar status do banco

---

## InformacoesCard

Responsável por:

- Exibir versão
- Última atualização

---

# Histórico de Implementações

## Sprint 01

- Estrutura inicial
- React
- Vite
- Supabase

---

## Sprint 02

- Produtos

---

## Sprint 03

- Entrada

---

## Sprint 04

- Saída

---

## Sprint 05

- Dashboard

---

## Sprint 06

- Lixeira

---

## Sprint 07

- Último fornecedor
- Última entrada

---

## Sprint 08

- Categorias

---

## Sprint 09

- Compras
- PDF

---

## Sprint 10

- Busca inteligente
- BuscaProduto reutilizável

---

## Sprint 11

- Sistema
- Informações
- Status do banco

---

## Sprint 12

- Backup completo
- Exportação JSON

---

## Sprint 13

- Controle de versão
- Melhorias gerais

---

## Sprint 14

- Login
- Sessão
- Controle de acesso

---

## Sprint 15

- Controle de usuários
- Perfis
- Desenvolvedor
- Gerencial
- Operador
- ProtectedRoute
- Controle de permissões
- Menu dinâmico
- Usuário não pode inativar a própria conta

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
- Sistema
- Backup
- Login
- Controle de usuários
- Controle de permissões
- Sessão
- Rotas protegidas

---

# Próximas Melhorias

- Restauração de backup
- Alteração de senha
- Impedir duplicidade de login
- Garantir pelo menos um Desenvolvedor ativo
- Histórico de movimentações
- Relatórios
- Auditoria
- Logs
- Backup automático agendado
- Dashboard analítico
- Recuperação de senha
- Integração com autenticação nativa do Supabase

---

# Deploy

Hospedagem:

- Vercel

Banco de Dados:

- Supabase

---

# Observações

Sistema desenvolvido exclusivamente para uso interno da Visual Esquadrias.

Projeto iniciado com foco em simplicidade, rapidez e segurança, evoluindo para uma plataforma completa de gestão de estoque, fornecedores, compras, usuários e controle de acesso por perfis.
