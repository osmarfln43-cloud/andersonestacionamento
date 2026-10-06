# Anderson Estacionamento

Aplicação web para gestão de estacionamento.

## Ambiente de migração

Esta branch prepara a aplicação para executar com Supabase e Vercel. O deploy de produção e o domínio principal permanecem no ambiente atual até a validação final.

- Banco, autenticação e arquivos: projeto Supabase de destino.
- Hospedagem: Vercel.
- Repositório: GitHub.
- Variáveis de Preview estão vinculadas especificamente a esta branch.

## Validações pendentes antes do corte

- Confirmar os fluxos de leitura e gravação no Preview.
- Conferir uploads e arquivos armazenados.
- Fazer a exportação final dos dados imediatamente antes da troca de produção.
- Confirmar o deploy de produção antes de alterar o domínio.

## Desenvolvimento

Requer Node.js e npm:

```sh
npm ci
npm run dev
```
