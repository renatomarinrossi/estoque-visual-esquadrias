# Documentação do Sistema — Visual Esquadrias

## Versão 3.0.0

**Data de referência:** 02/08/2026  
**Branch de desenvolvimento:** `dev`  
**Tag de lançamento:** `v3.0.0`  
**Hospedagem:** Vercel (ambiente Production)  
**Banco e autenticação:** Supabase

---

## 1. Objetivo do sistema

O Visual Esquadrias é um sistema interno para controle de estoque e gestão financeira simplificada da empresa. O projeto prioriza:

- simplicidade de operação;
- rapidez;
- estabilidade;
- rastreabilidade dos lançamentos importantes;
- segurança por usuário e perfil;
- evolução incremental, sem transformar o sistema em um ERP complexo.

---

## 2. Tecnologias

### Frontend

- React 18;
- TypeScript;
- Vite;
- Tailwind CSS;
- React Router;
- Lucide React;
- jsPDF e jspdf-autotable.

### Backend e infraestrutura

- Supabase Auth;
- PostgreSQL / Supabase Database;
- Row Level Security (RLS);
- Supabase Edge Functions;
- Vercel;
- Git e GitHub.

---

## 3. Regras estruturais essenciais

### Identificação por ID

O campo `id` é o identificador interno de todos os registros. O campo `codigo` do produto é apenas visual e pode se repetir.

Nunca localizar, editar, excluir ou relacionar um produto usando somente o campo `codigo`.

### Estoque negativo

O estoque negativo é permitido intencionalmente. Ele representa uma possível divergência, saída indevida ou falta de lançamento de entrada e deve ser tratado como sinal de conferência.

Entradas e saídas atualizam o saldo de forma atômica no banco, evitando que movimentações simultâneas sobrescrevam o saldo uma da outra.

### Dados financeiros

Recebimentos e pagamentos são registros financeiros. Uma parcela que possui recebimentos não pode ser excluída por acidente, e o valor da parcela não pode ser reduzido abaixo do valor já recebido.

---

## 4. Perfis de acesso

| Perfil | Acesso principal |
|---|---|
| `DESENVOLVEDOR` | Acesso total, Sistema, Backup, Restauração, Usuários e Movimentações de Estoque. |
| `GERENCIAL` | Operação do sistema e Dashboard Financeiro. |
| `OPERADOR` | Operação diária de estoque e módulos liberados pelo menu; não acessa administração. |

O Dashboard Financeiro é restrito a `DESENVOLVEDOR` e `GERENCIAL`.

As telas administrativas também são protegidas por rota, mas a regra de segurança principal está no banco através de RLS: somente usuários autenticados e ativos podem acessar os dados operacionais.

---

## 5. Autenticação e usuários

### Funcionamento

O usuário entra no sistema com:

- **Usuário**: por exemplo, `Renato Rossi`;
- **Senha**.

O e-mail utilizado pelo Supabase fica oculto do fluxo normal. A Edge Function `autenticar-usuario` localiza o e-mail associado ao perfil e cria a sessão de autenticação.

### Segurança

- Senhas não são mais exibidas nem devem ser armazenadas em texto puro no sistema.
- O Supabase Auth é responsável pela senha e pela sessão.
- A tabela `usuarios` possui o vínculo `auth_user_id` com o usuário do Supabase Auth.
- Usuários inativos não podem iniciar sessão.
- O perfil não deve ser inferido a partir de dados do navegador; ele é carregado do Supabase após autenticação.

### Edge Functions necessárias

| Função | Responsabilidade |
|---|---|
| `autenticar-usuario` | Efetua login por nome de usuário e senha, usando o e-mail interno apenas no servidor. Deve permanecer com verificação JWT desativada, pois é chamada antes do login. |
| `gerenciar-usuarios` | Cria, edita, ativa, inativa e migra usuários. Só pode ser usada por Desenvolvedor autenticado. |

### E-mail de autenticação

No formulário de Usuários existe o campo opcional **E-mail de autenticação**. Ele permite associar um e-mail real ao usuário sem mudar o login exibido no sistema.

Ao alterar esse e-mail, confirmar eventuais mensagens de segurança enviadas pelo Supabase antes de considerar a alteração concluída.

---

## 6. Módulo de estoque

### Dashboard

Exibe indicadores de estoque, fornecedores e produtos que precisam de atenção.

### Produtos

Permite cadastrar, editar, pesquisar, filtrar e enviar produtos para a lixeira.

Campos principais:

- código;
- descrição;
- categoria;
- unidade;
- quantidade;
- estoque mínimo;
- preço de compra;
- fornecedor padrão;
- observação;
- última entrada.

### Entrada e saída

As operações usam a função SQL `ajustar_estoque`.

- Entrada aumenta o saldo, atualiza fornecedor, preço e última entrada.
- Saída reduz o saldo e pode deixá-lo negativo.
- Cada operação gera um registro automático em `movimentacoes_estoque`.

### Movimentações de Estoque

Módulo exclusivo do Desenvolvedor, disponível abaixo de Entrada e Saída no menu.

Cada registro contém:

- data e hora;
- produto;
- tipo (`ENTRADA` ou `SAIDA`);
- quantidade;
- saldo anterior;
- saldo resultante;
- usuário responsável.

Os filtros disponíveis são data inicial, data final, produto e tipo de movimentação.

### Compras

Exibe itens abaixo do estoque mínimo, permite filtrar por categoria e gerar PDF.

### Fornecedores

Cadastro, edição, exclusão e pesquisa de fornecedores.

### Lixeira

Produtos excluídos são preservados na tabela `lixeira`. Ao restaurar, o produto retorna com o mesmo `id` original.

---

## 7. Módulo financeiro

### 7.1 Arquitetura de vendas

A arquitetura financeira de vendas é obrigatoriamente:

```text
Venda
  └── Parcelas
        └── Recebimentos
```

Uma venda possui várias parcelas. Cada parcela possui um ou mais recebimentos.

### 7.2 Vendas

Campos principais da venda:

- data da venda;
- cliente;
- valor total;
- responsável;
- status;
- observações.

Status da venda:

- `A_RECEBER`;
- `RECEBIDO`.

A venda fica `RECEBIDO` somente quando todas as suas parcelas estão recebidas.

### 7.3 Parcelas

Cada parcela possui:

- número da parcela;
- total de parcelas;
- valor;
- vencimento;
- forma de pagamento;
- status;
- descrição de condicionado à entrega, quando aplicável.

Formas de pagamento:

- `PIX`;
- `DINHEIRO`;
- `CARTAO`;
- `BOLETO`;
- `CHEQUE`;
- `CONDICIONADO_ENTREGA`.

`CONDICIONADO_ENTREGA` é uma forma de pagamento, não um checkbox. Parcelas condicionadas não exigem vencimento e aparecem separadas nos relatórios e no Dashboard Financeiro.

Status automático da parcela:

| Total recebido | Status |
|---:|---|
| R$ 0,00 | `A_RECEBER` |
| Maior que zero e menor que o valor da parcela | `PARCIALMENTE_RECEBIDO` |
| Maior ou igual ao valor da parcela | `RECEBIDO` |

### 7.4 Recebimentos

Para cada recebimento são registrados:

- data;
- valor;
- observação opcional.

Na tela de detalhes da venda é possível:

- registrar recebimento total ou parcial;
- visualizar o histórico;
- alterar data, valor e observação de um recebimento;
- excluir conscientemente um recebimento indevido.

Após alterar ou excluir um recebimento, os status e saldos da parcela e da venda são recalculados automaticamente.

### 7.5 Proteções financeiras

- Parcela com recebimento não pode ser removida durante a edição da venda.
- Venda com recebimentos não pode ser excluída por acidente.
- O valor de uma parcela não pode ser menor que o total já recebido.
- Para remover uma parcela com recebimentos, primeiro devem ser removidos os recebimentos correspondentes de forma consciente.

Essas regras existem tanto no frontend quanto em triggers do banco.

### 7.6 Tabela de Vendas

A listagem apresenta:

```text
Cliente | Próx. Recebimento | Total venda | Status | Receb. restante | Ações
```

`Receb. restante` é o total da venda menos todos os seus recebimentos registrados.

### 7.7 Contas a Receber

Lista parcelas pendentes e permite filtrar por período, cliente e forma de pagamento. A tela separa:

1. valores atrasados;
2. valores a receber no período;
3. condicionados à entrega.

Há geração de PDF e consulta otimizada de recebimentos em lote.

### 7.8 Contas a Pagar

Cada conta possui:

- nome/favorecido;
- vencimento;
- valor;
- meio de pagamento;
- status;
- data de pagamento.

Meios de pagamento:

- `PIX`;
- `BOLETO`;
- `CHEQUE_FISICA`;
- `CHEQUE_JURIDICA`.

Ao confirmar pagamento, o sistema pede a data de pagamento e grava:

- status `PAGO`;
- `data_pagamento`.

A tabela usa os títulos:

```text
Nome | Vencimento | Pago em | Valor | Meio | Status | Ações
```

Há filtros por período, nome e meio de pagamento, além de PDF.

### 7.9 Dashboard Financeiro

Restrito aos perfis Desenvolvedor e Gerencial.

O filtro de período é aplicado a valores com vencimento definido. Os condicionados à entrega ficam separados, fora do saldo projetado do período.

Indicadores:

- a receber no período;
- condicionados à entrega;
- a pagar no período;
- saldo projetado;
- atrasados e vencidos.

O PDF do Dashboard segue a mesma separação.

---

## 8. Backup e restauração

O módulo Sistema é exclusivo do Desenvolvedor.

O backup completo em JSON inclui:

- fornecedores;
- produtos;
- lixeira;
- usuários;
- vendas;
- vendas_parcelas;
- vendas_recebimentos;
- contas_pagar.

A restauração completa usa uma função do banco e preserva identificadores. Ela exige confirmação visual no sistema e confirmação textual com a palavra `RESTAURAR`.

### Atenção

A restauração substitui os dados atuais. Antes de restaurar, gerar um backup novo e conferir o arquivo selecionado.

---

## 9. Estrutura resumida do banco

| Tabela | Finalidade |
|---|---|
| `produtos` | Cadastro e saldo atual do estoque. |
| `fornecedores` | Cadastro de fornecedores. |
| `lixeira` | Produtos removidos, preservando o ID original. |
| `usuarios` | Perfil do usuário, login, status e vínculo com Auth. |
| `vendas` | Cabeçalho da venda. |
| `vendas_parcelas` | Parcelas de cada venda. |
| `vendas_recebimentos` | Histórico de recebimentos por parcela. |
| `contas_pagar` | Despesas e compromissos financeiros. |
| `movimentacoes_estoque` | Histórico automático de entradas e saídas. |

### Funções e regras relevantes

- `ajustar_estoque(...)`: atualiza o saldo e grava movimentação na mesma operação.
- `restaurar_backup_completo(...)`: restaura backup completo; deve ser restrita a Desenvolvedor.
- `usuario_ativo()`: valida usuário autenticado e ativo nas políticas RLS.
- `eh_desenvolvedor()`: valida perfil de Desenvolvedor para operações administrativas.

---

## 10. Scripts SQL aplicados na evolução 3.0

Os scripts executados no Supabase devem ser preservados no repositório em uma pasta de migrações em evolução futura.

Principais alterações aplicadas:

1. Ajustes da arquitetura de vendas, parcelas e recebimentos.
2. Políticas RLS para recebimentos e contas a pagar.
3. Permissão de vencimento nulo para parcelas condicionadas à entrega.
4. Função de backup/restauração completa, com tratamento de colunas identity.
5. Autenticação e vínculo `auth_user_id` em `usuarios`.
6. Função `ajustar_estoque` para atualização atômica de estoque.
7. Tabela e RLS de `movimentacoes_estoque`.
8. Triggers de proteção de parcelas, recebimentos e vendas.
9. Coluna `data_pagamento` em `contas_pagar`.
10. Políticas gerais para usuários autenticados e ativos.

---

## 11. Arquivos importantes do frontend

```text
src/
├── components/
│   ├── auth/ProtectedRoute.tsx
│   ├── Financeiro/
│   │   ├── VendaForm.tsx
│   │   ├── VendaTable.tsx
│   │   ├── VendaDetalhes.tsx
│   │   ├── ParcelasForm.tsx
│   │   ├── ReceberParcelaModal.tsx
│   │   ├── EditarRecebimentoModal.tsx
│   │   └── ConfirmarPagamentoModal.tsx
│   ├── layout/Sidebar.tsx
│   ├── sistema/
│   └── usuarios/
├── contexts/AuthContext.tsx
├── pages/
│   ├── Financeiro/
│   │   ├── Vendas.tsx
│   │   ├── ContasReceber.tsx
│   │   ├── ContasPagar.tsx
│   │   └── DashboardFinanceiro.tsx
│   └── Movimentacoes/Movimentacoes.tsx
├── services/
│   ├── authUsuario.ts
│   ├── produtoSupabase.ts
│   ├── vendaSupabase.ts
│   ├── vendaParcelaSupabase.ts
│   ├── vendaRecebimentoSupabase.ts
│   ├── contasReceberSupabase.ts
│   ├── contaPagarSupabase.ts
│   ├── movimentacaoEstoqueSupabase.ts
│   └── backup/
└── types/
```

---

## 12. Processo de desenvolvimento e publicação

### Antes de publicar

1. Testar os fluxos alterados no navegador.
2. Executar:

   ```bash
   npm run build
   ```

3. Conferir alterações:

   ```bash
   git status
   ```

4. Criar commit descritivo.
5. Enviar a branch `dev` ao GitHub.
6. Conferir o deploy da Vercel.
7. Promover o deploy para Production quando ele estiver `Ready`.

### Comandos usuais

```bash
git add src package.json docs
git commit -m "descrição objetiva da alteração"
git push origin dev
npm run build
```

### Observação sobre a Vercel

A branch `dev` pode gerar Preview. O deploy validado deve ser promovido manualmente para Production pela aba **Deployments**, quando necessário.

---

## 13. Validação mínima após deploy

- login com usuário e senha;
- Dashboard e Produtos;
- entrada e saída de estoque;
- Movimentações de Estoque para Desenvolvedor;
- cadastro e consulta de vendas;
- recebimento parcial, alteração e exclusão de recebimento;
- Contas a Receber;
- Contas a Pagar com confirmação e data de pagamento;
- Dashboard Financeiro para Desenvolvedor/Gerencial;
- geração de PDF;
- backup e restauração somente em ambiente controlado.

---

## 14. Pendências e melhorias futuras

Itens recomendados para versões futuras:

- versionar os scripts SQL/migrações dentro do repositório;
- tratar os avisos de lint e substituir os `any` remanescentes por tipos adequados;
- dividir o bundle principal do frontend para reduzir o aviso de tamanho na build;
- criar auditoria detalhada de alterações e exclusões financeiras;
- recuperação de senha por e-mail;
- integração de Compras com Contas a Pagar;
- fluxo de caixa e caixa diário;
- exportação e importação por planilha;
- inventário;
- relatórios gerenciais adicionais.

---

## 15. Referência para novas conversas de desenvolvimento

Ao retomar o projeto, considerar esta documentação como a referência principal da versão 3.0. Antes de alterar estruturas críticas:

1. conferir os arquivos atuais do projeto;
2. preservar a arquitetura por ID;
3. preservar a arquitetura financeira Venda → Parcelas → Recebimentos;
4. não misturar lógica antiga de pagamento por venda com pagamento por parcela;
5. não remover proteções de RLS, autenticação, backup ou histórico financeiro;
6. entregar arquivos completos quando um arquivo precisar ser substituído;
7. executar `npm run build` antes de publicar.


