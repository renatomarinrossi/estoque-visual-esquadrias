# Backup e recuperação

## O que o backup inclui

O backup gerado pela tela **Sistema** é um arquivo JSON com os dados operacionais do Estoque Visual Esquadrias:

- fornecedores;
- produtos ativos;
- produtos na lixeira;
- usuários do sistema;
- vendas;
- parcelas das vendas;
- recebimentos;
- contas a pagar.

O arquivo preserva os identificadores e os relacionamentos necessários para restaurar esses dados pelo sistema.

## Como gerar

1. Entre como **DESENVOLVEDOR**.
2. Acesse **Sistema**.
3. Clique em **Gerar backup**.
4. Guarde o arquivo JSON em local seguro, de preferência fora do computador principal.

Recomendação: gere um backup antes de alterações importantes e mantenha cópias periódicas.

## Como restaurar

1. Entre como **DESENVOLVEDOR**.
2. Acesse **Sistema**.
3. Selecione o arquivo JSON no campo de restauração.
4. Confira o aviso e confirme a restauração.

O sistema aceita arquivos compatíveis com `backupVersion` 2 ou superior e limite de 50 MB.

## Limites importantes

O JSON é um backup dos **dados operacionais**. Ele não substitui uma cópia completa do projeto e do ambiente Supabase.

Não estão incluídos no JSON:

- senhas dos usuários;
- contas do Supabase Authentication;
- políticas RLS e permissões do banco;
- funções SQL, Edge Functions e secrets;
- configurações do Vercel e do domínio.

Por isso, uma recuperação completa em um projeto Supabase novo exige também o código do Git, os arquivos em `supabase/migrations` e a recriação/configuração das Edge Functions.

## Antes de restaurar em produção

Faça um backup novo do estado atual. A restauração altera os dados existentes e deve ser feita somente por quem conhece o impacto da operação.

