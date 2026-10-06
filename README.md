# Anderson Estacionamento

Interface React + Vite compartilhada entre a web e o APK POS. A Vercel publica a branch
`android-pos-piloto` em https://andersonestacionamento.online. O APK empacota a interface e
integra a impressora SUNMI; o aplicativo Windows abre o domínio e acompanha a versão web.

Esta branch prepara a migração do backend para o Supabase próprio `zjzqtrhctilnyzqoorys`.
A transferência dos dados e a ativação em produção devem seguir [migration/README.md](migration/README.md).
O ambiente anterior continua em produção até a validação do destino.

## Desenvolvimento e verificação

Usar Node.js 22 ou 24 e npm. Executar `npm ci`, copiar `.env.example` para `.env.local`,
preencher a chave pública do Supabase de destino e executar `npm run dev`.

- `npm test`: testes do aplicativo e das funções/configuração.
- `npx tsc --noEmit -p tsconfig.app.json`: verificar tipos do frontend.
- `npm run build`: gerar `dist` para a Vercel.
- `npm run build -- --mode android`: gerar os assets para o APK.

O build exige as variáveis do novo Supabase. A leitura de fotos usa Plate Recognizer no backend;
sem a chave dessa integração, o operador pode preencher os dados manualmente.

## Publicação

O projeto Vercel `andersonestacionamento-v1u2` está ligado a este repositório e ao domínio.
Configurar as três variáveis de `.env.example` primeiro no Preview da branch de migração.
Mesclar em `android-pos-piloto` somente após migrar e testar os dados, Auth, Storage e funções.

O workflow `android-pos.yml` usa a variável de repositório `VITE_SUPABASE_PUBLISHABLE_KEY`
para a chave pública do destino. O APK precisa ser recompilado e instalado na POS no corte:
APKs antigos continuam apontando para o backend anterior. Nunca colocar a chave `service_role`
nessa variável. O workflow `windows-desktop.yml` e a ponte nativa SUNMI foram preservados.

O EXE usa a versão publicada no domínio e requer internet; a impressão SUNMI é exclusiva do APK.
Validar impressão e download de relatórios nos equipamentos antes de encerrar a migração.

Inventário SQL somente leitura: [migration/audit.sql](migration/audit.sql).
