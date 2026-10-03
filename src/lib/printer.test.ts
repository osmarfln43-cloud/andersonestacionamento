import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildReceiptESCPOS,
  printViaBluetooth,
  requestBluetoothPrinter,
  type PrinterConfig,
} from './printer';

describe('impressão Bluetooth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('pareia e envia um comprovante ESC/POS completo em blocos seguros', async () => {
    const chunks: Uint8Array[] = [];
    const characteristic = {
      uuid: '0000ff02-0000-1000-8000-00805f9b34fb',
      properties: { writeWithoutResponse: true },
      writeValueWithoutResponse: vi.fn(async (chunk: Uint8Array) => {
        chunks.push(new Uint8Array(chunk));
      }),
    };
    const service = {
      uuid: '0000ff00-0000-1000-8000-00805f9b34fb',
      getCharacteristics: vi.fn(async () => [characteristic]),
    };
    const server = {
      connected: true,
      getPrimaryServices: vi.fn(async () => [service]),
    };
    const device = {
      id: 'printer-test-id',
      name: 'Impressora Térmica Teste',
      gatt: { connected: false, connect: vi.fn(async () => server) },
      addEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      bluetooth: {
        requestDevice: vi.fn(async () => device),
        getDevices: vi.fn(async () => [device]),
      },
    });

    const connection = await requestBluetoothPrinter();
    expect(connection?.device.name).toBe('Impressora Térmica Teste');

    const config: PrinterConfig = {
      name: device.name,
      type: 'bluetooth',
      paperWidth: '80mm',
      bluetoothId: device.id,
      serviceUUID: service.uuid,
      characteristicUUID: characteristic.uuid,
    };
    const receipt = buildReceiptESCPOS({
      placa: 'ABC1D23',
      modelo: 'CIVIC',
      cor: 'PRETO',
      entrada: '2026-10-03T15:00:00.000Z',
      saida: '2026-10-03T16:00:00.000Z',
      tempoTotal: '1 HORA',
      formaPagamento: 'DINHEIRO',
      valorHora: 10,
      valorTotal: 10,
      ticketCodigo: '2610031001',
    });

    await expect(printViaBluetooth(receipt, config)).resolves.toBe(true);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.byteLength <= 20)).toBe(true);
    expect(Uint8Array.from(chunks.flatMap((chunk) => Array.from(chunk)))).toEqual(receipt);
  });
});