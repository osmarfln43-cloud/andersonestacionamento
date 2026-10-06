# Migração do Anderson Estacionamento

Preparação iniciada em 05/10/2026 (Brasil). Em 06/10/2026 foi feita a restauração inicial do backup de origem no Supabase de destino; o corte para produção ainda não foi feito.

| Componente | Origem | Destino |
| --- | --- | --- |
| Código em produção | GitHub, android-pos-piloto, commit 3e8efa8 | GitHub, branch migration/supabase-vercel-production |
| Banco, Auth e Storage | fllkpiwmckppzvhrjlia (Lovable Cloud) | zjzqtrhctilnyzqoorys (Supabase próprio) |
| Aplicativo | Vercel, projeto andersonestacionamento-v1u2 | Mesmo projeto Vercel |
| Domínio | andersonestacionamento.online | Mesmo domínio |
| Reconhecimento de veículos | Função identify-vehicle da origem | Plate Recognizer direto |

## Estado e pré-requisitos

- A branch prepara o código, a configuração da Vercel e as quatro Edge Functions.
- A exportação da origem, a importação no destino e a troca em produção ainda dependem de acesso e validação.
- A produção usa android-pos-piloto; main é Preview e contém alterações diferentes.
- Não mesclar esta branch em android-pos-piloto antes da validação dos dados e das variáveis na Vercel.
- A chave pública real do destino e a chave Plate Recognizer não estão no repositório.
- O repositório não contém os registros de produção, os usuários Auth nem os arquivos do Storage.
- Esta base de produção contém 15 migrações; main contém outras duas. O schema exportado da origem
  deve ser comparado com ambos os históricos. Não inferir o schema ativo somente pela branch web.
- O destino mantém 11 tabelas públicas com RLS, 37 políticas, 37 triggers, dois buckets de aplicação
  e quatro Edge Functions ativas.
- A restauração inicial importou todas as linhas das 11 tabelas públicas: audit_logs 3.204,
  veiculos 636, movimentacoes 700, pagamentos 701, unidades 1, configuracoes 1 e
  identidade_visual 1; clientes, despesas e mensalistas estão vazias na origem e no destino.
- Auth contém os três usuários e três identidades de e-mail do backup. Os três hashes de senha e
  confirmações de e-mail foram preservados. A origem tinha dois perfis; um dos três usuários Auth
  não tinha perfil, e essa relação foi preservada. Os usuários precisarão entrar novamente.
- As cinco fotos de `vehicle-photos` foram comparadas por nome com a origem e correspondem a todos
  os cinco objetos. Faltam quatro objetos de `qrcode-images`; o bucket de destino está vazio.
  `database_export_06_10_26` é o bucket temporário do export, não um bucket funcional do aplicativo.
- Os campos ativos de Storage nas tabelas públicas agora apontam para o projeto novo; a conferência
  encontrou zero URLs com o prefixo antigo. O histórico em audit_logs manteve as URLs originais.
- O Lovable continua publicado no domínio conforme a captura enviada. A Vercel também lista o domínio
  como verificado no projeto, mas o DNS/tráfego ainda não foi validado nem cortado para a Vercel.
- O projeto Lovable de origem `estacionamentoanderson` pertence ao perfil livroscursosc@gmail.com;
  o backup de banco foi recebido. Ainda falta a cópia dos quatro QR Codes e um export final perto do corte.

## 1. Inventariar e preservar

Executar [audit.sql](audit.sql) na origem e no destino. É somente leitura e retorna contagens, tabelas,
RLS, índices, relacionamentos, triggers e publicação Realtime, sem expor registros pessoais.
Salvar os resultados fora do Git. Confirmar o conteúdo atual do destino antes de qualquer importação.
Se o destino já tiver dados, exportá-los e reconciliar os conflitos; não apagar nem substituir em massa.

Tabelas a conferir, considerando também o histórico de main: audit_logs, clientes, configuracoes,
despesas, identidade_visual, mensalistas, movimentacoes, pagamentos, profiles, unidades e veiculos.
O inventário informa tabelas ausentes; não criar estruturas de main por suposição.

A exportação inicial já foi recebida em formato ZIP com arquivo PostgreSQL customizado e ficou fora
 do repositório. Antes do corte será necessário gerar uma exportação final para incluir alterações
 feitas na origem após o primeiro backup. Storage é separado: baixar/copiar os arquivos de todos os
 buckets. O backup e os arquivos contêm dados sensíveis; mantê-los fora deste repositório público.
 A pasta migration-data/ está ignorada pelo Git.

O export oficial pode conter contas Auth e hashes de senha. Preservar UUIDs e identidades evita quebrar
profiles.user_id e os campos de operador em movimentacoes. Sessões precisam de novo login.
Se houver somente CSV das tabelas públicas, isso não constitui uma exportação de usuários Auth.

## 2. Restaurar em teste

Concluído para a restauração inicial: o backup customizado foi lido e descomprimido com pg_restore 18,
e os nomes das colunas das 11 tabelas públicas, auth.users e auth.identities coincidiram com o destino.
Os dados foram importados seletivamente para o schema já existente; não foi restaurado o arquivo inteiro
com --clean nem substituídos os metadados internos gerenciados pelo Supabase. O histórico de migrações
do projeto de destino foi preservado.

Comparar o schema real com supabase/migrations antes de aplicar o histórico.
A primeira migração insere unidade/configuração de exemplo; outra promove um perfil específico
a administrador. Esses comandos históricos não devem sobrescrever as configurações e os papéis
da origem. Conciliar seeds, ordem de FKs e triggers de criação de perfil/auditoria durante o restore.
Se o backup já trouxe o schema, não reaplicar CREATE TABLE/CREATE POLICY.
Conferir e reconciliar também o histórico supabase_migrations antes de usar db push no futuro.

Os dados públicos, três contas Auth e três identidades foram importados. Sessões e tokens de atualização
não foram transferidos; todos precisarão entrar novamente. A conferência no destino mostra as mesmas
contagens de linhas da exportação inicial, zero URLs ativas com o prefixo antigo, nenhuma FK não validada
e nenhum gatilho de auditoria deixado desativado. Ainda falta validar login real com uma conta migrada,
permissões do aplicativo e uma exportação final antes do corte.

**Permissões a revisar antes do corte:** o histórico existente permite operações amplas para
qualquer usuário autenticado, inclusive edição do próprio perfil e exclusão de perfis.
Controles do menu não substituem RLS. O Advisor do destino também sinaliza que `fn_audit_log`,
`handle_new_user` e `resolve_auth_email` são funções `SECURITY DEFINER` executáveis por `anon` e
`authenticated`; revisar as permissões e o uso de e-mail no login por usuário. Confirmar os papéis
pretendidos e testar operador/admin diretamente na API; não declarar que a segurança foi validada
só porque o login abriu.

## 3. Copiar os arquivos

Os cinco objetos físicos de `vehicle-photos` foram comparados por nome e estão no destino. A origem
tem quatro objetos físicos em `qrcode-images`, mas nenhum foi copiado ainda. O banco aponta os campos
ativos de Storage para o projeto destino; os QR Codes continuarão indisponíveis até que seus arquivos
sejam copiados. O bucket temporário `database_export_06_10_26` não deve ser migrado como bucket do app.

Somente depois de validar a cópia, substituir o prefixo
https://fllkpiwmckppzvhrjlia.supabase.co/storage/v1/object/public/
por
https://zjzqtrhctilnyzqoorys.supabase.co/storage/v1/object/public/
nos campos que realmente usam esse prefixo:

- configuracoes.logo_login_url, logo_interna_url e qr_code_url;
- identidade_visual.logo_login_url;
- movimentacoes.foto_url;
- unidades.logo_url.

Não substituir URLs externas, data URLs ou caminhos vazios. Conferir todos os logos, QR Codes
e fotos na versão de testes. Conteúdo histórico em audit_logs deve manter a evidência original.

## 4. Configurar autenticação e funções

Na configuração Auth do destino, Site URL e redirects de produção/Preview já foram configurados.
As três identidades da exportação usam provedor de e-mail. O Google não aparece entre as identidades
migradas e continua desabilitado. Hoje:

- Site URL: https://andersonestacionamento.online
- Redirect URLs: domínio de produção, domínio www e URL de Preview atual.
- Confirm email está habilitado; os três usuários exportados já estavam confirmados.
- Os hashes de senha foram preservados; é necessário testar login e recuperação com um usuário migrado.
- Um Auth user da origem não tinha perfil; ele foi mantido sem perfil para não conceder papel novo.
- Reproduzir a política de cadastro/confirmacão e configurar SMTP de produção antes do corte.
- Contas legadas @parking.local precisam de e-mail real verificado por um administrador para
  receber recuperação. A função pública não altera mais o e-mail Auth a partir do perfil.

Segredos das funções no destino:

| Nome | Uso |
| --- | --- |
| PLATE_RECOGNIZER_API_KEY | Necessário para leitura por foto |
| PLATE_RECOGNIZER_MMC | true somente se a conta habilita marca/modelo/cor; padrão desativado |
| PASSWORD_RESET_ALLOWED_ORIGINS | Origens HTTPS exatas, separadas por vírgula; padrão é o domínio de produção |

SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são fornecidos pelo ambiente das
Edge Functions. Nunca colocar service_role, senhas ou chaves do reconhecedor em VITE_*.

As quatro funções abaixo já estão ativas no destino (publicação inicial pelo dashboard). Depois de
autenticar a CLI com a conta correta, usar estes comandos para publicar versões futuras:

    npx supabase functions deploy identify-vehicle --project-ref zjzqtrhctilnyzqoorys
    npx supabase functions deploy request-password-reset --project-ref zjzqtrhctilnyzqoorys
    npx supabase functions deploy invite-user --project-ref zjzqtrhctilnyzqoorys
    npx supabase functions deploy admin-set-user-password --project-ref zjzqtrhctilnyzqoorys

As três funções autenticadas mantêm verify_jwt=true. identify-vehicle também verifica a sessão
e o perfil ativo. request-password-reset permite chamada pública e restringe o destino do link.
Testar compatibilidade do JWT do novo projeto antes do corte; não desabilitar verificação para
contornar erro de autenticação.

Sem a chave Plate Recognizer, o operador continua cadastrando manualmente e consultando
o histórico. Não há chamada alternativa ao Lovable. Marca/modelo/cor podem ficar vazios sem MMC.

## 5. Publicar Preview e validar

O projeto Vercel `andersonestacionamento-v1u2` usa `android-pos-piloto` em produção. A branch de
migração está em Preview Ready com variáveis do Supabase de destino; build, TypeScript e 36 testes
passaram. O domínio aparece associado e verificado no projeto Vercel, mas a captura do Lovable ainda
mostra o site publicado ali e o DNS não foi confirmado no destino Vercel. Production não recebeu as
variáveis novas e continua sem corte. Testar login real com usuário migrado, fotos/QR Codes e fluxo do
estacionamento no Preview antes de alterar Production ou DNS.
O build rejeita URL antiga, placeholder e chave service_role.

Build: npm ci, npm run build, saída dist. vercel.json inclui fallback SPA e controle de cache do SW.
Testar atualização direta de /entrada, /saida e /reset-password.

Checklist de aceitação:

1. Login de um usuário migrado, logout, recuperação de senha e permissões de operador/admin.
2. Clientes, veículos, mensalistas e movimentações: contagens e exemplos iguais à origem.
3. Entrada e saída de carro/moto, cálculo, pagamento e fechamento de caixa.
4. Fotos, logos e QR Code carregados do destino.
5. Leitura com foto real, ausência de placa, chave ausente e preenchimento manual.
6. Impressão USB e SUNMI no equipamento real; preservar o gerador ESC/POS compartilhado dos transportes web.
7. PWA atualizado e conferência de qualquer APK/EXE que carregue o domínio ou tenha bundle próprio.
8. Não restar tráfego para o banco antigo ou para APIs Lovable no navegador.

## 6. Corte e retorno

Marcar uma janela curta de manutenção para impedir novas gravações na origem durante a exportação
final/importação. Copiar também arquivos novos. Reconciliar contagens e totais do caixa após o corte.
Guardar a versão anterior da Vercel e a configuração anterior sem divulgar chaves.

Depois dos testes, atualizar as variáveis Production, mesclar em android-pos-piloto e publicar na Vercel.
Configurar também a variável de repositório VITE_SUPABASE_PUBLISHABLE_KEY com a chave pública
do destino para o workflow Android. Recompilar e instalar o APK na POS; o APK antigo mantém
o backend embutido no bundle. O EXE Windows acompanha o domínio sem uma troca de URL.
O domínio permanece o mesmo. Os usuários entram novamente no novo Supabase.
Observar erros de autenticação, uploads, pagamentos e funções antes de encerrar a manutenção.

Se houver falha, interromper novas gravações e decidir entre corrigir o destino ou voltar ao deploy
anterior com suas variáveis. Se já houve dados novos no destino, reconciliá-los antes de qualquer
retorno; um simples rollback do frontend pode dividir o histórico entre os dois bancos.
Remoção definitiva do Lovable Cloud é uma etapa separada, após a conferência final e os backups.

## Referências

- https://docs.lovable.dev/features/cloud/advanced-settings
- https://docs.lovable.dev/tips-tricks/external-deployment-hosting
- https://supabase.com/docs/guides/functions/auth
- https://guides.platerecognizer.com/docs/snapshot/api-reference/
