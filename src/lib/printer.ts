// Thermal Printer Manager using WebUSB API + fallback to browser print

export interface PrinterConfig {
  name: string;
  type: 'usb' | 'browser';
  paperWidth: '58mm' | '80mm';
  vendorId?: number;
  productId?: number;
}

const THERMAL_PRINTER_FILTERS = [
  { vendorId: 0x0416 }, // Winbond (many thermal printers)
  { vendorId: 0x0483 }, // STMicroelectronics  
  { vendorId: 0x04b8 }, // Epson
  { vendorId: 0x0519 }, // Star Micronics
  { vendorId: 0x0525 }, // Netchip
  { vendorId: 0x067b }, // Prolific (USB-Serial adapters)
  { vendorId: 0x0fe6 }, // ICS Electronics
  { vendorId: 0x1504 }, // Many POS printers
  { vendorId: 0x1a86 }, // QinHeng (CH340/CH341)
  { vendorId: 0x1fc9 }, // NXP
  { vendorId: 0x20d1 }, // Datecs
  { vendorId: 0x28e9 }, // GD32 based printers
  { vendorId: 0x0dd4 }, // Custom printers
  { vendorId: 0x0456 }, // Analog Devices
  { vendorId: 0x0493 }, // POS printers
];

let connectedDevice: any = null;

export function isWebUSBSupported(): boolean {
  return 'usb' in navigator;
}

export function getSavedPrinterConfig(): PrinterConfig | null {
  try {
    const saved = localStorage.getItem('printer_config');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function savePrinterConfig(config: PrinterConfig) {
  localStorage.setItem('printer_config', JSON.stringify(config));
}

export function clearPrinterConfig() {
  localStorage.removeItem('printer_config');
  connectedDevice = null;
}

export async function requestUSBPrinter(): Promise<any | null> {
  if (!isWebUSBSupported()) {
    console.warn('[Printer] WebUSB não suportado neste navegador');
    return null;
  }
  
  // Try without filters first so the user can pick ANY USB device
  try {
    const device = await (navigator as any).usb.requestDevice({ filters: [] });
    connectedDevice = device;
    console.log('[Printer] Dispositivo selecionado:', device.productName, 
      `vendor:0x${device.vendorId?.toString(16)} product:0x${device.productId?.toString(16)}`);
    return device;
  } catch (err: any) {
    // User cancelled or no devices available
    console.warn('[Printer] Seleção cancelada ou sem dispositivos:', err?.message || err);
    return null;
  }
}

export async function getConnectedUSBPrinters(): Promise<any[]> {
  if (!isWebUSBSupported()) return [];
  try {
    const devices = await (navigator as any).usb.getDevices();
    console.log('[Printer] Dispositivos pareados:', devices.length, 
      devices.map((d: any) => d.productName || `0x${d.vendorId?.toString(16)}`));
    return devices;
  } catch (err) {
    console.error('[Printer] Erro ao listar dispositivos:', err);
    return [];
  }
}

// ESC/POS command builders
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function escposInit(): number[] {
  return [ESC, 0x40]; // Initialize printer
}

function escposAlign(align: 'left' | 'center' | 'right'): number[] {
  const n = align === 'left' ? 0 : align === 'center' ? 1 : 2;
  return [ESC, 0x61, n];
}

function escposBold(on: boolean): number[] {
  return [ESC, 0x45, on ? 1 : 0];
}

function escposFontSize(w: number, h: number): number[] {
  return [GS, 0x21, ((w - 1) << 4) | (h - 1)];
}

function escposCut(): number[] {
  return [GS, 0x56, 0x00]; // Full cut
}

function escposFeed(lines: number): number[] {
  return [ESC, 0x64, lines];
}

// CODE128 barcode with human readable text below
function escposBarcode(code: string, height = 70, moduleWidth = 2): number[] {
  const clean = code.replace(/[^\x20-\x7e]/g, '');
  if (!clean) return [];
  const payload = textToBytes(`{B${clean}`);
  return [
    GS, 0x48, 0x02,            // HRI below barcode
    GS, 0x66, 0x00,            // HRI font A
    GS, 0x68, height,          // barcode height
    GS, 0x77, moduleWidth,     // module width
    GS, 0x6b, 73, payload.length, ...payload,
    LF,
  ];
}

// Set print density (0-15, higher = darker)
function escposDensity(level: number): number[] {
  // GS ( K - Set print density
  return [GS, 0x7C, Math.min(15, Math.max(0, level))];
}

function textToBytes(text: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text));
}

function dashedLine(width: number): number[] {
  return [...textToBytes('-'.repeat(width)), LF];
}

function formatCurrency(value: number): string {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function wrapText(text: string, width: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = '';
      }

      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function pushWrappedText(cmds: number[], text: string, width: number) {
  wrapText(text, width).forEach((line) => cmds.push(...textToBytes(line), LF));
}

function pushLabelValueBlock(
  cmds: number[],
  label: string,
  value: string,
  width: number,
  valueAlign: 'left' | 'center' | 'right' = 'left',
  emphasizeValue = false,
) {
  cmds.push(...escposAlign('left'));
  cmds.push(...escposBold(true));
  cmds.push(...textToBytes(`${label}:`), LF);
  cmds.push(...escposBold(false));

  cmds.push(...escposAlign(valueAlign));
  if (emphasizeValue) cmds.push(...escposBold(true));
  pushWrappedText(cmds, value, width);
  if (emphasizeValue) cmds.push(...escposBold(false));

  cmds.push(...escposAlign('left'));
}

export function buildReceiptESCPOS(data: {
  nomeEstacionamento?: string;
  disclaimer?: string;
  diasFuncionamento?: string;
  horarioAbertura?: string;
  horarioFechamento?: string;
  placa: string;
  modelo?: string;
  cor?: string;
  entrada: string;
  saida?: string;
  tempoTotal?: string;
  tipoCliente?: string;
  formaPagamento?: string;
  valorHora?: number;
  valorTotal?: number;
  mensagemComprovante?: string;
  endereco?: string;
  telefone?: string;
  cnpj?: string;
  ticketCodigo?: string;
}, paperWidth: '58mm' | '80mm' = '80mm'): Uint8Array {
  const cols = paperWidth === '58mm' ? 24 : 32;
  const cmds: number[] = [];

  cmds.push(...escposDensity(12)); // High density for darker print
  cmds.push(...escposInit());

  // Header
  cmds.push(...escposAlign('center'));
  cmds.push(...escposBold(true));
  cmds.push(...escposFontSize(1, 1));
  pushWrappedText(cmds, data.nomeEstacionamento || 'ANDERSON ESTACIONAMENTO', cols);
  cmds.push(...escposBold(false));
  cmds.push(...dashedLine(cols));

  // Disclaimer
  cmds.push(...escposFontSize(1, 1));
  const disclaimer = data.disclaimer || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO';
  const horarios = `FUNC. ${(data.diasFuncionamento || 'SEG A SEX').toUpperCase()} ${data.horarioAbertura || '07:00'}-${data.horarioFechamento || '19:00'}`;
  pushWrappedText(cmds, disclaimer, cols);
  pushWrappedText(cmds, horarios, cols);
  cmds.push(...dashedLine(cols));

  // Plate (big)
  cmds.push(...escposFontSize(2, 2));
  cmds.push(...escposBold(true));
  cmds.push(...textToBytes(data.placa), LF);
  cmds.push(...escposFontSize(1, 1));
  pushWrappedText(cmds, `(${(data.modelo || 'N/I').toUpperCase()} ${(data.cor || '').toUpperCase()})`, cols);
  cmds.push(...escposBold(false));
  cmds.push(...dashedLine(cols));

  // Details
  cmds.push(...escposAlign('left'));
  const entradaDt = new Date(data.entrada);
  const entradaStr = `${entradaDt.toLocaleDateString('pt-BR')} ${entradaDt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  pushLabelValueBlock(cmds, 'Entrada', entradaStr, cols);

  if (data.saida) {
    const saidaDt = new Date(data.saida);
    const saidaStr = `${saidaDt.toLocaleDateString('pt-BR')} ${saidaDt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    pushLabelValueBlock(cmds, 'Saida', saidaStr, cols);
  }

  if (data.tempoTotal) {
    pushLabelValueBlock(cmds, 'Permanencia', data.tempoTotal, cols);
  }

  pushLabelValueBlock(cmds, 'Tabela', data.tipoCliente === 'mensalista' ? 'Mensalista' : 'Avulso', cols);

  if (data.formaPagamento) {
    pushLabelValueBlock(cmds, 'Pagamento', data.formaPagamento.toUpperCase(), cols);
  }

  pushLabelValueBlock(cmds, 'Valor/hora', `R$ ${formatCurrency(data.valorHora || 10)}`, cols, 'left', true);
  cmds.push(...dashedLine(cols));

  // Total
  if (data.saida && data.valorTotal != null) {
    cmds.push(...escposAlign('center'));
    cmds.push(...escposBold(true));
    cmds.push(...escposFontSize(1, 1));
    cmds.push(...textToBytes('Total'), LF);
    cmds.push(...escposFontSize(2, 2));
    cmds.push(...textToBytes(`R$ ${formatCurrency(data.valorTotal)}`), LF);
    cmds.push(...escposFontSize(1, 1));
    cmds.push(...escposBold(false));
    cmds.push(...dashedLine(cols));
  }

  // Payment highlight
  cmds.push(...escposAlign('center'));
  cmds.push(...escposBold(true));
  pushWrappedText(cmds, 'PAGAMENTO DINHEIRO OU PIX', cols);
  cmds.push(...escposBold(false));
  cmds.push(...dashedLine(cols));

  // Footer
  cmds.push(...escposBold(true));
  pushWrappedText(cmds, data.mensagemComprovante || 'ANDERSON ESTACIONAMENTO AGRADECE A PREFERENCIA', cols);
  cmds.push(...escposBold(false));
  if (data.endereco) {
    pushWrappedText(cmds, data.endereco.toUpperCase(), cols);
  }
  if (data.telefone) {
    pushWrappedText(cmds, `MEU CONTATO: ${data.telefone}`, cols);
  }
  if (data.cnpj) {
    pushWrappedText(cmds, `CNPJ: ${data.cnpj}`, cols);
  }

  cmds.push(...escposFeed(4));
  cmds.push(...escposCut());

  return new Uint8Array(cmds);
}

export async function printViaUSB(data: Uint8Array): Promise<boolean> {
  if (!connectedDevice) {
    const devices = await getConnectedUSBPrinters();
    if (devices.length > 0) {
      connectedDevice = devices[0];
    } else {
      return false;
    }
  }

  try {
    await connectedDevice.open();
    if (connectedDevice.configuration === null) {
      await connectedDevice.selectConfiguration(1);
    }
    await connectedDevice.claimInterface(0);

    // Find the OUT endpoint
    const iface = connectedDevice.configuration!.interfaces[0];
    const alt = iface.alternates[0];
    const endpoint = alt.endpoints.find(e => e.direction === 'out');

    if (endpoint) {
      await connectedDevice.transferOut(endpoint.endpointNumber, data);
    } else {
      // Try control transfer as fallback
      await connectedDevice.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x09,
        value: 0x0200,
        index: 0x00,
      }, data);
    }

    await connectedDevice.close();
    return true;
  } catch (err) {
    console.error('USB print error:', err);
    try { await connectedDevice.close(); } catch {}
    return false;
  }
}

export async function printTestPage(paperWidth: '58mm' | '80mm' = '80mm'): Promise<boolean> {
  const testData = buildReceiptESCPOS({
    nomeEstacionamento: 'TESTE DE IMPRESSAO',
    placa: 'TST1234',
    modelo: 'TESTE',
    cor: 'PRETO',
    entrada: new Date().toISOString(),
    tipoCliente: 'avulso',
    valorHora: 10,
    mensagemComprovante: 'IMPRESSORA CONFIGURADA COM SUCESSO!',
  }, paperWidth);

  return printViaUSB(testData);
}
