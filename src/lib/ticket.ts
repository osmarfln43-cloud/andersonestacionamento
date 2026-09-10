// Ticket code generation + barcode helpers

/**
 * Generates a short numeric ticket code (10 digits) used on the printed
 * barcode. Numeric-only keeps CODE128 short and easy to type by hand.
 */
export function generateTicketCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${yy}${mm}${dd}${rand}`;
}

export function formatTicketCode(code?: string | null): string {
  if (!code) return '';
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 10) return code;
  return `${clean.slice(0, 6)} ${clean.slice(6)}`;
}

export function normalizeTicketCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 10);
}

/** Renders a CODE128 barcode as an SVG markup string (browser only). */
export function barcodeSvgMarkup(
  value: string,
  opts: { width?: number; height?: number; displayValue?: boolean; fontSize?: number } = {},
): string {
  if (!value) return '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const JsBarcode = require('jsbarcode');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, value, {
      format: 'CODE128B',
      width: opts.width ?? 1.6,
      height: opts.height ?? 50,
      displayValue: opts.displayValue ?? true,
      fontSize: opts.fontSize ?? 16,
      fontOptions: 'bold',
      textMargin: 1,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return svg.outerHTML;
  } catch {
    return '';
  }
}
