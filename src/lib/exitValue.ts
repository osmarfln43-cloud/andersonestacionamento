export function parseExitValue(input: string): number | undefined {
  if (!input.trim()) return undefined;
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error('Informe um valor válido com até duas casas decimais.');
  const value = Number(normalized);
  if (!Number.isFinite(value)) throw new Error('Valor inválido.');
  return value;
}

export function canCancelEntry(mov: { status_movimentacao: string; status_pagamento?: string }) {
  return mov.status_movimentacao === 'ativo' && mov.status_pagamento !== 'pago';
}