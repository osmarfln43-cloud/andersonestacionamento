export type BillingSummary = {
  hours: number;
  mins: number;
  total: number;
  billableHours: 1 | 2;
  pricingMode: 'hourly' | 'daily';
};

const SECOND_HOUR_THRESHOLD_MINUTES = 80;
const DAILY_THRESHOLD_HOURS = 3;

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

  if (diffMs / 3600000 >= DAILY_THRESHOLD_HOURS) {
    return {
      hours,
      mins,
      total: params.valorDiaria,
      billableHours: 2,
      pricingMode: 'daily',
    };
  }

  const billableHours: 1 | 2 = totalMinutes >= SECOND_HOUR_THRESHOLD_MINUTES ? 2 : 1;

  return {
    hours,
    mins,
    total: billableHours * params.valorHora,
    billableHours,
    pricingMode: 'hourly',
  };
}
