# Anderson Estacionamento

Aplicativo React + Vite com Supabase próprio para banco, autenticação, arquivos e Edge Functions.
Hospedagem prevista na Vercel em https://andersonestacionamento.online.

Esta branch prepara a migração. A transferência dos dados e a ativação em produção devem seguir
[migration/README.md](migration/README.md).

## Desenvolvimento

Usar Node.js 22 ou 24 e npm.

1. Executar npm ci.
2. Copiar .env.example para .env.local.
3. Preencher a chave pública do projeto Supabase de destino.
4. Executar npm run dev.

## Verificação

- npm test: testes do aplicativo e das funções/configuração.
- npx tsc --noEmit -p tsconfig.app.json: verificação de tipos do frontend.
- npm run build: gerar dist para a Vercel.

O build exige as variáveis do novo Supabase. O banco anterior não é usado como fallback.
O reconhecimento de fotos chama Plate Recognizer diretamente pelo backend e requer uma chave
nos segredos do Supabase. Sem ela, o cadastro manual continua disponível.

## Infraestrutura

- GitHub: osmarfln43-cloud/andersonestacionamento.
- Supabase de destino: zjzqtrhctilnyzqoorys.
- Vercel: npm ci, npm run build, saída dist.
- Configuração e sequência da migração: [migration/README.md](migration/README.md).
- Inventário SQL somente leitura: [migration/audit.sql](migration/audit.sql).
