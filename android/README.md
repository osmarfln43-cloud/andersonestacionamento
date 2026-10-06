# Android POS - piloto SUNMI P2 SE

Este módulo gera um APK Android com o aplicativo web empacotado no WebViewAssetLoader (origem local HTTPS) e uma ponte Android para a impressora SUNMI de 58 mm. A interface usa a largura lógica disponível, sem forçar 480 ou 720 CSS px; deve ser conferida na máquina real em 320, 360 e 411 dp. É um aplicativo híbrido com integração nativa da impressora, não uma reescrita de todas as telas em componentes Android.

## Gerar APK

No GitHub, abra Actions > Android POS piloto > Run workflow. O artefato `Anderson-Estacionamento-POS-APK-piloto` contém `app-debug.apk`. É um build de teste assinado com a chave debug gerada pelo ambiente de CI; para distribuição, configurar assinatura release própria.

Para o backend próprio, configurar a variável de repositório `VITE_SUPABASE_PUBLISHABLE_KEY`
com a chave pública de `zjzqtrhctilnyzqoorys`. O workflow define a URL e o ID desse destino.
APKs antigos precisam ser substituídos no corte, pois têm o backend anterior no bundle.
Somente executar o corte após migrar e conferir os dados, Auth, Storage e Edge Functions.

Localmente: `npm ci && npm run build -- --mode android && mkdir -p android/app/src/main/assets && cp -R dist/. android/app/src/main/assets/ && gradle -p android :app:assembleDebug` (JDK 17, Android SDK 35, Gradle 8.9).

O banco Supabase e suas funções exigem rede. Os dados persistem no servidor; nenhuma entrada offline foi implementada. Login por senha deve ser validado na POS. Fluxos OAuth externos precisam de redirecionamento Android próprio e não estão validados neste piloto.

A impressão usa `com.sunmi:printerlibrary:1.0.18`, consulta estado da impressora, envia transação e aguarda `onPrintResult`. Se faltar papel, o cadastro no Supabase não é revertido; use a segunda via existente. O ticket é 58 mm, sem corte (P2 SE). Testar no aparelho real: status, tampa, papel, código de barras, câmeras, entrada, saída, reimpressão, login e teclado.
