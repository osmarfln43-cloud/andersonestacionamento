# Impressão térmica via Bluetooth

## O que será criado

- Adicionar **Bluetooth** como terceira opção de impressão, junto de USB e navegador.
- Na tela de Configurações, incluir o botão **Buscar impressoras Bluetooth** para abrir a lista de aparelhos próximos e permitir o pareamento.
- Exibir nome e status da impressora Bluetooth selecionada, mantendo a escolha salva neste aparelho.
- Permitir desconectar, trocar o tamanho do papel e enviar uma impressão de teste.
- Fazer comprovantes de entrada, saída e reimpressões usarem automaticamente a impressora Bluetooth configurada.
- Se a conexão Bluetooth falhar, avisar claramente e preservar a impressão pelo navegador como alternativa.

## Compatibilidade

- A conexão direta usará Bluetooth de baixa energia (BLE), disponível principalmente no Chrome/Edge em Android e computadores compatíveis, sempre em conexão segura.
- Impressoras que funcionam somente com Bluetooth clássico podem não aparecer no navegador; nesses casos, a opção de impressão do navegador continuará disponível.

## Detalhes técnicos

- Reutilizar o mesmo comprovante ESC/POS já usado pela impressão USB, preservando código de barras, valores e formatos de 58/80 mm.
- Procurar serviços e características graváveis da impressora BLE, incluindo identificadores comuns de impressoras térmicas.
- Enviar os dados em blocos pequenos para evitar cortes e limites do Bluetooth.
- Guardar apenas identificadores públicos da impressora; o pareamento e a permissão permanecem controlados pelo navegador/sistema operacional.
- Atualizar a tela de configurações e centralizar o envio do comprovante conforme o tipo configurado.
