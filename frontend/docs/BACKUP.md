# Backup e recuperação

## O que o backup inclui

O backup gerado pela tela **Sistema** é um arquivo JSON com os dados operacionais do Estoque Visual Esquadrias:

- fornecedores;
- produtos ativos;
- produtos na lixeira;
- usuários do sistema, sem senha;
- entradas e movimentações de estoque;
- vendas;
- parcelas das vendas;
- recebimentos;
- contas a pagar;
- funcionários, folha, ajustes, períodos e movimentos de férias, arquivo de férias antigas e feriados;
- auditorias financeira e do DP, metadados de exportação de logs.

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

O sistema aceita versões 2, 3 (convertida para 4 na aplicação), 4, 5 e 6, até 50 MB. A versão 6 substitui integralmente as 21 tabelas operacionais, valida contagens, IDs e vínculos Auth e guarda uma cópia anterior em `backup_seguranca` na mesma transação. Uma falha desfaz toda a restauração. A substituição usa tabelas explícitas, sem `TRUNCATE CASCADE`.

Versões antigas usam importação aditiva: tabelas ausentes permanecem intactas e IDs já existentes não são sobrescritos. Portanto, não revertem alterações em registros existentes. A conversão v3 recupera os vínculos antigos de folha e férias quando há informações suficientes; inconsistências são recusadas. Nunca altere manualmente a versão para contornar a validação.

O horário do último backup fica no servidor e é compartilhado entre dispositivos. Ele comprova a geração, não que o arquivo foi salvo: confira o download. O histórico administrativo de backups e as cópias internas não são exportados recursivamente. A cópia no mesmo banco não substitui armazenamento externo.

## Limites importantes

O JSON é um backup dos **dados operacionais**. Ele não substitui uma cópia completa do projeto e do ambiente Supabase.

Não estão incluídos no JSON:

- senhas dos usuários;
- contas do Supabase Authentication;
- políticas RLS e permissões do banco;
- funções SQL, Edge Functions e secrets;
- configurações do Vercel e do domínio.

Por isso, uma recuperação completa em um projeto Supabase novo exige também o código do Git, os arquivos em `supabase/migrations` e a recriação/configuração das Edge Functions.

## Recuperar em outro projeto

1. Prepare um projeto isolado, aplique as migrations na ordem e configure RLS, funções, secrets, e-mail e URLs de autenticação. Recupere também Storage e infraestrutura, se utilizados.
2. Recupere o Auth por procedimento suportado do Supabase, preservando UUIDs. Se precisar recriar contas, faça um mapeamento explícito e revisado dos UUIDs antes da importação. O JSON não recupera senhas e a restauração recusa referências Auth inexistentes.
3. Garanta um desenvolvedor autenticado no destino; a restauração v6 exige que seu vínculo esteja presente no arquivo.
4. Restaure e confira contagens, estoque, pagamentos, permissões de desenvolvedor/operador, login e geração de backup antes de apontar o domínio.

Mantenha backup nativo do projeto/banco além do JSON; a disponibilidade depende do plano e configuração do Supabase. Para recuperar uma cópia anterior à restauração, um desenvolvedor pode exportar `backup_seguranca.conteudo` por acesso administrativo autorizado e submetê-la à mesma validação. Confira a data da cópia antes de restaurar.

## Retenção de auditoria

A tela de logs permite exportar lotes antigos de até 5.000 registros, mantendo pelo menos 90 dias no banco. A confirmação de remoção exige selecionar novamente o arquivo salvo, conferir conteúdo e SHA-256. O servidor restringe a exclusão ao lote e registra o hash. Nenhum expurgo automático é ativado. Guarde esses arquivos externamente.

## Ambientes

Demonstração: `jnaojtkggsedzauizxgh.supabase.co`. Produção: `ukakbfidmmtkntbftsda.supabase.co`. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no build. O domínio `demo.visualesquadrias.com` recusa o banco de produção. Nunca coloque chave administrativa em variável `VITE_` ou no bundle.

## Antes de restaurar em produção

Faça um backup novo do estado atual. A restauração altera os dados existentes e deve ser feita somente por quem conhece o impacto da operação.
