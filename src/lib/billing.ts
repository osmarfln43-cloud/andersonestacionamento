export type BillingSummary = {
  hours: number;
  mins: number;
  total: number;
  billableHours: number;
  pricingMode: 'hourly' | 'daily';
  regraAplicada: string;
};

/**
 * Regras de cobrança:
 * - Até 1h19m  → 1 hora
 * - 1h20m–2h09m → 2 horas
 * - 2h10m–3h19m → 3 horas
 * - 3h20m+      → diária cheia (valor fixo)
 */
const HOUR_THRESHOLD_MINUTES = 80;   // 1h20m → 2 horas
const THREE_HOUR_THRESHOLD = 130;    // 2h10m → 3 horas
const DAILY_THRESHOLD_MINUTES = 200; // 3h20m → diária

export function calculateParkingBilling(params: {
  entrada: string | Date;
  valorHora: number;
  valorDiaria: number;
  now?: Date;
}): BillingSummary {
  const now = params.now ?? new Date();
  const entrada = params.entrada instanceof Date ? params.entrada : new Date(params.entrada);
  const diffMs = Math.max(now.getTime() - entrada.getTime(), 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  // 3h20m+ → diária cheia
  if (totalMinutes >= DAILY_THRESHOLD_MINUTES) {
    return { hours, mins, total: params.valorDiaria, billableHours: 0, pricingMode: 'daily', regraAplicada: 'Diária' };
  }

  // Determinar horas cobráveis
  let billableHours: number;
  if (totalMinutes >= THREE_HOUR_THRESHOLD) {
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
