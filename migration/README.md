# Migração do Anderson Estacionamento

Preparação iniciada em 05/10/2026 (Brasil). Este roteiro não indica que os dados já foram transferidos.

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
- A auditoria do destino em 05/10/2026 encontrou zero tabelas públicas, zero usuários Auth,
  nenhum bucket e nenhuma Edge Function. Nenhum dado foi importado nessa auditoria.
- O projeto Lovable referenciado no README de main não está acessível à conta conectada.
  O acesso à origem ou o fornecimento de uma exportação completa ainda é necessário.

## 1. Inventariar e preservar

Executar [audit.sql](audit.sql) na origem e no destino. É somente leitura e retorna contagens, tabelas,
RLS, índices, relacionamentos, triggers e publicação Realtime, sem expor registros pessoais.
Salvar os resultados fora do Git. Confirmar o conteúdo atual do destino antes de qualquer importação.
Se o destino já tiver dados, exportá-los e reconciliar os conflitos; não apagar nem substituir em massa.

Tabelas a conferir, considerando também o histórico de main: audit_logs, clientes, configuracoes,
despesas, identidade_visual, mensalistas, movimentacoes, pagamentos, profiles, unidades e veiculos.
O inventário informa tabelas ausentes; não criar estruturas de main por suposição.

No Lovable: More → Cloud → Overview → Advanced settings → Export project data → Export data.
Baixar a exportação quando estiver pronta. Baixar separadamente os arquivos de qrcode-images
e vehicle-photos e verificar se existem outros buckets. O arquivo exportado contém informações
sensíveis; mantê-lo fora deste repositório público. A pasta migration-data/ está ignorada pelo Git.

O export oficial pode conter contas Auth e hashes de senha. Preservar UUIDs e identidades evita quebrar
profiles.user_id e os campos de operador em movimentacoes. Sessões precisam de novo login.
Se houver somente CSV das tabelas públicas, isso não constitui uma exportação de usuários Auth.

## 2. Restaurar em teste

Inspecionar primeiro o formato e o conteúdo do backup. O export customizado .backup precisa de
pg_restore com suporte à compressão do arquivo; não é SQL para colar no SQL Editor.
Revisar os objetos com pg_restore --list antes de planejar a restauração seletiva.
Supabase já tem schemas gerenciados, roles e extensões: não restaurar todo o arquivo com --clean.

Comparar o schema real com supabase/migrations antes de aplicar o histórico.
A primeira migração insere unidade/configuração de exemplo; outra promove um perfil específico
a administrador. Esses comandos históricos não devem sobrescrever as configurações e os papéis
da origem. Conciliar seeds, ordem de FKs e triggers de criação de perfil/auditoria durante o restore.
Se o backup já trouxe o schema, não reaplicar CREATE TABLE/CREATE POLICY.
Conferir e reconciliar também o histórico supabase_migrations antes de usar db push no futuro.

Preservar o schema e os dados públicos, as contas e identidades Auth, funções SQL, sequências,
triggers, índices, RLS e associações Realtime. Executar novamente audit.sql e comparar com a origem.
Testar a criação de registros e verificar a ausência de perfis órfãos e IDs duplicados.

**Permissões a revisar antes do corte:** o histórico existente permite operações amplas para
qualquer usuário autenticado, inclusive edição do próprio perfil e exclusão de perfis.
Controles do menu não substituem RLS. Confirmar os papéis pretendidos e testar operador/admin
diretamente na API; não declarar que a segurança foi validada só porque o login abriu.

## 3. Copiar os arquivos

Copiar o conteúdo físico dos buckets, mantendo nomes e caminhos. Reproduzir as políticas da origem
após revisá-las. Os buckets registrados nas migrações são públicos. Contar objetos e comparar
conteúdo/tamanho; metadados restaurados não equivalem à cópia física do Storage.

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

Na configuração Auth do destino:

- Site URL: https://andersonestacionamento.online
- Redirect URL: https://andersonestacionamento.online/reset-password
- Adicionar explicitamente o endereço de teste e /reset-password enquanto ele for usado.
- Reproduzir política de cadastro/confirmacão e configurar SMTP de produção.
- O login observado neste código usa login/e-mail + senha. Google não aparece na tela atual;
  habilitá-lo somente se a auditoria da origem comprovar que é utilizado.
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

Depois de autenticar a CLI com a conta correta, publicar explicitamente no destino:

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

O projeto Vercel andersonestacionamento-v1u2 já atende o domínio e usa android-pos-piloto em produção.
Configurar as três variáveis de .env.example para a branch de migração em Preview, usando a chave
pública real do destino. O build rejeita URL antiga, placeholder e chave service_role.
Chaves modernas sb_publishable_ não codificam o ID do projeto: confirmar seu funcionamento
com o destino durante o teste de integração.

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
