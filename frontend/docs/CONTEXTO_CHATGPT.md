# CONTEXTO DO PROJETO
# Visual Esquadrias

## Objetivo

Desenvolver um sistema simples de controle de estoque para a empresa Visual Esquadrias.

O objetivo NÃO é criar um ERP.

A prioridade é simplicidade, rapidez, estabilidade e facilidade de uso.

---

# Tecnologias

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

Backend

- Supabase

Banco

- PostgreSQL

Hospedagem

- Vercel

Controle de versão

- Git
- GitHub

---

# Filosofia do projeto

Sempre priorizar simplicidade.

Evitar bibliotecas desnecessárias.

Evitar excesso de funcionalidades.

O sistema deve ser intuitivo para qualquer funcionário.

---

# Regra mais importante

O sistema NÃO utiliza mais o código do produto como identificador.

Toda operação utiliza o campo:

id

O campo

codigo

é apenas uma informação exibida ao usuário.

É permitido possuir vários produtos com o mesmo código.

Exemplo

CON449
Branco

CON449
Preto

São produtos diferentes.

Toda edição, exclusão, entrada, saída e restauração utilizam o ID.

---

# Banco

Tabelas

produtos

fornecedores

usuarios

lixeira

---

# Lixeira

A tabela lixeira possui o campo

produto_id

que guarda o ID original do produto.

Ao restaurar um produto, ele deve voltar utilizando o mesmo ID.

Nunca criar um novo ID.

---

# Padrão de desenvolvimento

Nunca utilizar

codigo

para localizar registros.

Sempre utilizar

id

Nunca alterar funcionalidades que já estejam funcionando.

Sempre preservar compatibilidade.

Quando possível, realizar alterações pequenas e seguras.

---

# Organização

O projeto possui documentação em

/docs

Arquivos

DOCUMENTACAO_SISTEMA.md

CHANGELOG.md

BANCO_DE_DADOS.md

BACKUP.md

DEPLOY.md

PADRAO_DE_CODIGO.md

ROADMAP.md

Este arquivo (CONTEXTO_CHATGPT.md)

---

# Fluxo de trabalho

Sempre trabalhar sobre os arquivos atuais do projeto.

Evitar reconstruir arquivos grandes.

Quando necessário, trabalhar em cima do projeto compactado (.zip).

---

# Situação atual

Sistema funcional.

Módulo Produtos refatorado para utilizar ID.

Entrada utilizando ID.

Saída utilizando ID.

Exclusão utilizando ID.

Edição utilizando ID.

Busca de produtos corrigida.

Ordenação dos produtos por ordem de cadastro.

Lixeira preparada para manter o ID original.

Compras funcionando.

Backup em evolução.

Restauração em evolução.

---

# Próximas melhorias

Finalizar restauração completa do backup.

Logs do sistema.

Histórico de movimentações.

Inventário.

Relatórios avançados.

Controle de pedidos.

Controle de compras.

Dashboard avançado.

Exportação para Excel.

Importação para Excel.

Permissões avançadas.

---

# Como iniciar uma nova conversa

Sempre considerar este documento como referência principal.

Ler primeiro:

CONTEXTO_CHATGPT.md

Depois:

DOCUMENTACAO_SISTEMA.md

Depois:

CHANGELOG.md

Se necessário, analisar o projeto compactado enviado pelo usuário.

Nunca assumir funcionalidades que não estejam documentadas.

Sempre manter a arquitetura baseada em ID.

---

# Observações

O projeto é desenvolvido de forma incremental.

Priorizar qualidade ao invés de quantidade.

Evitar mudanças grandes sem necessidade.

Antes de alterar uma estrutura importante, analisar os impactos nos demais módulos.

O objetivo é manter o Visual Esquadrias simples, estável e fácil de manter.
