# Ticket com código de barras + gestão financeira completa

## 1. Ticket com código de barras

- Cada entrada gera um código curto único (ex: `2609107431`), gravado na movimentação.
- O comprovante de entrada passa a sair com esse código impresso em números grandes **e** em código de barras (padrão CODE128), tanto na impressão térmica quanto no comprovante em tela/PDF.

## 2. Saída por leitura de código de barras

Na tela de Saída, um botão "Ler código" abre a câmera do celular/tablet:

- A câmera lê o código de barras do ticket e o veículo é localizado na hora, já mostrando permanência, tabela e valor a pagar.
- Campo alternativo para digitar o código à mão, caso o papel esteja danificado.
- Busca por placa continua funcionando como hoje.

## 3. Placa → marca, modelo e cor no comprovante

- A leitura da placa (ALPR já ativo) preenche marca, modelo e cor; esses dados passam a sair sempre no comprovante de entrada e de saída, junto do código do ticket.

## 4. Controle de despesas

- Nova área de despesas (descrição, categoria, valor, data, forma de pagamento) com lançamento, edição e exclusão.
- Categorias: funcionários, aluguel, energia, água, manutenção, impostos, outros.

## 5. Relatórios e fluxo de caixa

Um painel financeiro com seletor de período: **hoje, semana, mês, últimos 30 dias, semestre, ano e personalizado**. Para cada período:

- Receita total, despesas totais e **lucro líquido**, com destaque no total geral.
- Receita separada por dinheiro e PIX, e por avulso/mensalista.
- Gráfico de faturamento no tempo (barras) e gráfico de composição de despesas.
- Estatísticas operacionais: veículos atendidos, ocupação média, tempo médio de permanência, horários de pico, ticket médio.
- Fechamento diário, semanal, mensal, semestral e anual em tabela, com linha de total.
- Exportação em PDF/CSV mantida.

## Detalhes técnicos

- Banco: `movimentacoes.ticket_codigo` (texto, único, indexado); nova tabela `despesas` (unidade_id, descricao, categoria, valor, data, forma_pagamento, observacao) com RLS + GRANTs no padrão do projeto.
- Código de barras: geração CODE128 com `jsbarcode` (SVG em tela/PDF) e comando ESC/POS `GS k` na impressora térmica.
- Leitura: `BarcodeDetector` nativo quando disponível, com fallback `@zxing/browser`; reuso do padrão de câmera de `NightCameraCapture.tsx`.
- Relatórios: hook `useFinanceiroPeriodo` agregando `movimentacoes` + `despesas`; gráficos com Recharts (já no projeto).
