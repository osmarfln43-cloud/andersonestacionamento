import { describe, it, expect } from "vitest";
import { calculateParkingBilling } from "./billing";

const VALOR_HORA = 10;
const VALOR_DIARIA = 35;

function billAt(minutes: number) {
  const entrada = new Date("2026-01-01T10:00:00");
  const now = new Date(entrada.getTime() + minutes * 60_000);
  return calculateParkingBilling({
    entrada,
    valorHora: VALOR_HORA,
    valorDiaria: VALOR_DIARIA,
    now,
  });
}

describe("calculateParkingBilling - regra de tolerância de 15min", () => {
  describe("Faixa 1 hora (até 1h15m)", () => {
    it("cobra 1 hora para 1 minuto", () => {
      const r = billAt(1);
      expect(r.billableHours).toBe(1);
      expect(r.total).toBe(10);
      expect(r.pricingMode).toBe("hourly");
    });

    it("cobra 1 hora para exatamente 1h", () => {
      const r = billAt(60);
      expect(r.billableHours).toBe(1);
      expect(r.total).toBe(10);
    });

    it("cobra 1 hora para 1h15m (limite superior da tolerância)", () => {
      const r = billAt(75);
      expect(r.billableHours).toBe(1);
      expect(r.total).toBe(10);
      expect(r.regraAplicada).toBe("1 hora");
    });
  });

  describe("Faixa 2 horas (1h16m até 2h15m)", () => {
    it("cobra 2 horas a partir de 1h16m", () => {
      const r = billAt(76);
      expect(r.billableHours).toBe(2);
      expect(r.total).toBe(20);
      expect(r.regraAplicada).toBe("2 horas");
    });

    it("cobra 2 horas para 1h20m", () => {
      const r = billAt(80);
      expect(r.billableHours).toBe(2);
      expect(r.total).toBe(20);
    });

    it("cobra 2 horas para 2h15m (limite superior)", () => {
      const r = billAt(135);
      expect(r.billableHours).toBe(2);
      expect(r.total).toBe(20);
    });
  });

  describe("Faixa 3 horas (2h16m até 3h15m)", () => {
    it("cobra 3 horas a partir de 2h16m", () => {
      const r = billAt(136);
      expect(r.billableHours).toBe(3);
      expect(r.total).toBe(30);
      expect(r.regraAplicada).toBe("3 horas");
    });

    it("cobra 3 horas para 3h15m (limite superior)", () => {
      const r = billAt(195);
      expect(r.billableHours).toBe(3);
      expect(r.total).toBe(30);
    });
  });

  describe("Faixa diária (3h16m+)", () => {
    it("aplica diária a partir de 3h16m", () => {
      const r = billAt(196);
      expect(r.pricingMode).toBe("daily");
      expect(r.total).toBe(VALOR_DIARIA);
      expect(r.regraAplicada).toBe("Diária");
    });

    it("aplica diária para estadias longas (10h)", () => {
      const r = billAt(600);
      expect(r.pricingMode).toBe("daily");
      expect(r.total).toBe(VALOR_DIARIA);
    });
  });
});
