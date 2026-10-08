import { describe, expect, it } from 'vitest';
import { canCancelEntry, parseExitValue } from './exitValue';

describe('valor avulso na saída', () => {
  it('usa o valor informado com centavos', () => { expect(parseExitValue('17,50')).toBe(17.5); });
  it('mantém cálculo automático quando vazio', () => { expect(parseExitValue('')).toBeUndefined(); });
  it('permite saída sem cobrança por valor zero', () => { expect(parseExitValue('0')).toBe(0); });
  it.each(['-10', 'NaN', 'Infinity', '1.234', 'abc'])('rejeita valor inválido %s', value => { expect(() => parseExitValue(value)).toThrow(); });
});
describe('cancelamento de entradas', () => {
  it.each(['carro', 'moto'])('permite cancelar entrada aberta de %s', () => { expect(canCancelEntry({ status_movimentacao: 'ativo', status_pagamento: 'pendente' })).toBe(true); });
  it.each(['finalizado', 'cancelado'])('não cancela %s', status => { expect(canCancelEntry({ status_movimentacao: status })).toBe(false); });
  it('não cancela entrada já paga', () => { expect(canCancelEntry({ status_movimentacao: 'ativo', status_pagamento: 'pago' })).toBe(false); });
});