# Anderson Estacionamento

Código único da interface para web e APK POS. A versão web é publicada na Vercel a partir da branch `android-pos-piloto`; o APK compila a interface no pacote e integra a impressora SUNMI. O aplicativo Windows abre `https://andersonestacionamento.online/` e carrega sempre a versão publicada nesse domínio.

## Publicação

1. Vincule o projeto Vercel a este repositório e use `android-pos-piloto` como Production Branch. Framework Vite, build `npm run build`, output `dist`. Configure `andersonestacionamento.online` no projeto Vercel.
2. Confirme as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` para o mesmo projeto Supabase do APK. Não troque o projeto sem migrar os dados e a autenticação.
3. A rota `/` e as demais rotas SPA são tratadas por `vercel.json`. A cada push na branch de produção, a Vercel publica a interface; o EXE a carrega no próximo acesso. O APK requer novo build e instalação.
4. O workflow `windows-desktop.yml` gera um EXE portátil. Ele requer internet e não contém dados de login. O workflow `android-pos.yml` gera o APK POS.
5. A função Supabase `identify-vehicle` foi alterada para usar somente Plate Recognizer quando configurado. Publique-a no projeto Supabase com `supabase functions deploy identify-vehicle`; sem `PLATE_RECOGNIZER_API_KEY`, o operador pode informar dados manualmente.

## Limites de migração

A aplicação continua usando Supabase Auth, banco e Edge Functions no projeto `fllkpiwmckppzvhrjlia`. É necessário confirmar a titularidade e a administração desse projeto fora do Lovable antes de afirmar independência completa da plataforma. O EXE não aciona a impressora SUNMI da POS; essa integração é exclusiva do APK Android.
