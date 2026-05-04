export type BillingSummary = {
  hours: number;
  mins: number;
  total: number;
  billableHours: number;
  pricingMode: 'hourly' | 'daily';
  regraAplicada: string;
};

/**
 * Regras de cobrança (com tolerância configurável, padrão 15min):
 * - Até 1h + tolerância       → 1 hora
 * - Até 2h + tolerância       → 2 horas
 * - Até 3h + tolerância       → 3 horas
 * - Acima de 3h + tolerância  → diária cheia (valor fixo)
 *
 * Ex.: tolerância=15 → 1h até 1h15m, 2h até 2h15m, 3h até 3h15m, diária a partir de 3h16m.
 */
const DEFAULT_TOLERANCIA_MIN = 15;

export function calculateParkingBilling(params: {
  entrada: string | Date;
  valorHora: number;
  valorDiaria: number;
  toleranciaMinutos?: number;
  now?: Date;
}): BillingSummary {
  const tol = Number.isFinite(params.toleranciaMinutos as number)
    ? Math.max(0, Math.floor(params.toleranciaMinutos as number))
    : DEFAULT_TOLERANCIA_MIN;

  const now = params.now ?? new Date();
  const entrada = params.entrada instanceof Date ? params.entrada : new Date(params.entrada);
  const diffMs = Math.max(now.getTime() - entrada.getTime(), 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  // Limites derivados da tolerância
  const HOUR_THRESHOLD_MINUTES = 60 + tol + 1;   // ex.: tol=15 → 76 (passa para 2h)
  const TWO_HOUR_THRESHOLD = 120 + tol + 1;      // ex.: tol=15 → 136 (passa para 3h)
  const DAILY_THRESHOLD_MINUTES = 180 + tol + 1; // ex.: tol=15 → 196 (vira diária)

  // Diária cheia
  if (totalMinutes >= DAILY_THRESHOLD_MINUTES) {
    return { hours, mins, total: params.valorDiaria, billableHours: 0, pricingMode: 'daily', regraAplicada: 'Diária' };
  }

  // Determinar horas cobráveis
  let billableHours: number;
  if (totalMinutes >= TWO_HOUR_THRESHOLD) {
    billableHours = 3;
  } else if (totalMinutes >= HOUR_THRESHOLD_MINUTES) {
    billableHours = 2;
  } else {
    billableHours = 1;
  }

  return {
    hours,
    mins,
    total: billableHours * params.valorHora,
    billableHours,
    pricingMode: 'hourly',
    regraAplicada: `${billableHours} hora${billableHours > 1 ? 's' : ''}`,
  };
}
