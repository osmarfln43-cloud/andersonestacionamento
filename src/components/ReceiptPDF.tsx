import { useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getSavedPrinterConfig, buildReceiptESCPOS, printViaUSB } from "@/lib/printer";
import BarcodeSvg from "@/components/BarcodeSvg";

export interface ReceiptData {
  placa: string;
  modelo: string;
  cor: string;
  tipo_cliente: string;
  entrada: string;
  saida?: string;
  tempoTotal?: string;
  valorTotal?: number;
  formaPagamento?: string;
  nomeEstacionamento?: string;
  endereco?: string;
  telefone?: string;
  chavePix?: string;
  tipoChavePix?: string;
  nomeBeneficiario?: string;
  mensagemComprovante?: string;
  valorHora?: number;
  tipo: "entrada" | "saida" | "unico";
  horarioAbertura?: string;
  horarioFechamento?: string;
  diasFuncionamento?: string;
  disclaimerComprovante?: string;
  qrCodeUrl?: string;
  cnpj?: string;
  regraAplicada?: string;
  ticketCodigo?: string;
}

interface Props {
  data: ReceiptData | null;
  onDone: () => void;
}

export default function ReceiptPDF({ data, onDone }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    // Print immediately with minimal delay for DOM render
    const timeout = setTimeout(() => printReceipt(), 300);
    return () => clearTimeout(timeout);
  }, [data]);

  const printReceipt = async () => {
    if (!data || !printRef.current) return;

    const printerConfig = getSavedPrinterConfig();
    const paperWidth = printerConfig?.paperWidth ?? '80mm';

    // Try USB direct printing first
    if (printerConfig?.type === 'usb') {
        const escposData = buildReceiptESCPOS({
          nomeEstacionamento: data.nomeEstacionamento,
          disclaimer: data.disclaimerComprovante,
          diasFuncionamento: data.diasFuncionamento,
          horarioAbertura: data.horarioAbertura,
          horarioFechamento: data.horarioFechamento,
          placa: data.placa,
          modelo: data.modelo,
          cor: data.cor,
          entrada: data.entrada,
          saida: data.saida,
          tempoTotal: data.tempoTotal,
          tipoCliente: data.tipo_cliente,
          formaPagamento: data.formaPagamento,
          valorHora: data.valorHora,
          valorTotal: data.valorTotal,
          mensagemComprovante: data.mensagemComprovante,
          endereco: data.endereco,
          telefone: data.telefone,
          cnpj: data.cnpj,
          ticketCodigo: data.ticketCodigo,
        }, paperWidth);

      const success = await printViaUSB(escposData);
      if (success) {
        onDone();
        return;
      }
      // Fall through to browser print if USB fails
    }

    // Always use hidden iframe for seamless auto-print (no popups)
    const printContent = printRef.current.innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = paperWidth;
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(buildPrintHTML(printContent, paperWidth));
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          onDone();
        }, 800);
      }, 300);
    } else {
      onDone();
    }
  };

  const buildPrintHTML = (content: string, paperWidth: '58mm' | '80mm' = '80mm') => {
    const is58mm = paperWidth === '58mm';
    const layout = {
      contentWidth: is58mm ? '36mm' : '44mm',
      baseFontSize: is58mm ? '8px' : '9px',
      rowFontSize: is58mm ? '8px' : '8.8px',
      titleFontSize: is58mm ? '10px' : '12px',
      plateFontSize: is58mm ? '15px' : '18px',
      vehicleInfoFontSize: is58mm ? '8px' : '8.5px',
      totalLabelFontSize: is58mm ? '10px' : '11px',
      totalValueFontSize: is58mm ? '14px' : '16px',
      paymentFontSize: is58mm ? '8.5px' : '9px',
      disclaimerFontSize: is58mm ? '6.8px' : '7.4px',
      footerFontSize: is58mm ? '7px' : '7.6px',
      footerAddrFontSize: is58mm ? '6.8px' : '7.2px',
      moneyFontSize: is58mm ? '10.2px' : '11.2px',
      qrSize: is58mm ? '20mm' : '22mm',
      letterSpacing: is58mm ? '0.4px' : '0.8px',
      bodyPadding: is58mm ? '2mm 4mm 2.5mm' : '2mm 5mm 2.5mm',
      receiptPadding: is58mm ? '0 1mm 0 0.5mm' : '0 1.5mm 0 1mm',
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprovante</title>
      <style>
        @page { size: ${paperWidth} auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html {
          width: ${paperWidth};
          background: #fff !important;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: ${layout.baseFontSize};
          width: ${paperWidth};
          margin: 0 auto;
          padding: ${layout.bodyPadding};
          color: #000 !important;
          background: #fff !important;
          line-height: 1.25;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .receipt {
          width: ${layout.contentWidth};
          max-width: 100%;
          margin: 0 auto;
          padding: ${layout.receiptPadding};
          color: #000 !important;
        }
        .title { font-size: ${layout.titleFontSize}; font-weight: 900; text-align: center; margin-bottom: 2px; padding-right: 1mm; overflow-wrap: anywhere; }
        .plate { font-size: ${layout.plateFontSize}; font-weight: 900; text-align: center; letter-spacing: ${layout.letterSpacing}; margin: 3px 0 1px; padding-right: 1mm; overflow-wrap: anywhere; }
        .vehicle-info { font-size: ${layout.vehicleInfoFontSize}; font-weight: 900; text-align: center; margin-bottom: 2px; padding-right: 1mm; overflow-wrap: anywhere; }
        .dashed { border-top: 1px dashed #000; margin: 3px 0; }
        .row {
          display: block;
          padding: 2px 0;
          font-size: ${layout.rowFontSize};
          width: 100%;
        }
        .row-label {
          display: block;
          width: 100%;
          max-width: 100%;
          padding-right: 1mm;
          font-weight: 700;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .row-value {
          display: block;
          width: 100%;
          max-width: 100%;
          margin-top: 1px;
          padding-right: 1mm;
          font-weight: 900;
          text-align: left;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          font-variant-numeric: tabular-nums;
        }
        .row-value-money {
          display: block;
          width: 100%;
          max-width: 100%;
          margin-top: 1px;
          padding-right: 1mm;
          font-size: ${layout.moneyFontSize};
          font-weight: 900;
          text-align: left;
          white-space: nowrap;
          overflow: visible;
          font-variant-numeric: tabular-nums;
        }
        .total-label { font-size: ${layout.totalLabelFontSize}; font-weight: 900; text-align: center; margin-top: 2px; padding-right: 1mm; }
        .total-value { font-size: ${layout.totalValueFontSize}; font-weight: 900; text-align: center; margin: 1px 0; padding-right: 1mm; font-variant-numeric: tabular-nums; }
        .payment-highlight { font-size: ${layout.paymentFontSize}; font-weight: 900; text-align: center; margin: 2px 0; padding-right: 1mm; overflow-wrap: anywhere; }
        .disclaimer { font-size: ${layout.disclaimerFontSize}; text-align: center; line-height: 1.2; margin: 1px 0; padding-right: 1mm; font-weight: 700; overflow-wrap: anywhere; }
        .footer { font-size: ${layout.footerFontSize}; text-align: center; font-weight: 900; margin-top: 2px; padding-right: 1mm; overflow-wrap: anywhere; }
        .footer-addr { font-size: ${layout.footerAddrFontSize}; text-align: center; margin-top: 1px; padding-right: 1mm; font-weight: 700; overflow-wrap: anywhere; }
        .qr-container { width: 100%; text-align: center; margin: 3px 0; padding-right: 1mm; }
        .qr-container img, .qr-container canvas { width: ${layout.qrSize} !important; height: ${layout.qrSize} !important; }
        .regra-box { font-size: 11px; font-weight: 900; text-align: center; border: 1px solid #000; padding: 2px 4px; margin: 2px auto; display: inline-block; }
        .ticket-label { font-size: ${layout.paymentFontSize}; font-weight: 900; text-align: center; margin-top: 2px; }
        .ticket-code { font-size: ${layout.totalValueFontSize}; font-weight: 900; text-align: center; letter-spacing: 1px; font-variant-numeric: tabular-nums; }
        .barcode-container { width: 100%; text-align: center; margin: 2px 0 3px; }
        .barcode-container svg { width: 100% !important; max-width: ${layout.contentWidth}; height: auto !important; }
        @media print {
          html, body { width: ${paperWidth}; margin: 0; }
          body { padding: ${layout.bodyPadding}; justify-content: center; }
          .receipt { width: ${layout.contentWidth}; max-width: 100%; padding: ${layout.receiptPadding}; }
          * { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
  };

  if (!data) return null;

  const entradaDt = new Date(data.entrada);
  const entradaDate = entradaDt.toLocaleDateString("pt-BR");
  const entradaTime = entradaDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const disclaimer = data.disclaimerComprovante || "NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO";
  const horarios = `${(data.diasFuncionamento || "SEG-SEX").toUpperCase()} ${data.horarioAbertura || "07:00"}-${data.horarioFechamento || "19:00"}`;

  const pixCode = data.chavePix
    ? `00020126580014br.gov.bcb.pix0136${data.chavePix}5204000053039865802BR5925ANDERSON ESTACIONAMENTO6008SAOPAULO`
    : "";

  const isSaida = data.tipo === 'saida' && data.saida;
  const formatCurrency = (value: number) => Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ position: "fixed", left: "-9999px", top: "-9999px" }}>
      <div ref={printRef}>
        <div className="receipt">
          <div className="title">{data.nomeEstacionamento || "ANDERSON ESTACIONAMENTO"}</div>
          <div className="dashed"></div>

          <div className="disclaimer">{disclaimer}. {horarios}</div>
          <div className="dashed"></div>

          {isSaida && (
            <div className="payment-highlight">COMPROVANTE DE SAIDA</div>
          )}

          <div className="plate">{data.placa}</div>
          <div className="vehicle-info">({(data.modelo || "N/I").toUpperCase()} {(data.cor || "").toUpperCase()})</div>
          <div className="dashed"></div>

          <div className="row">
            <span className="row-label">Entrada:</span>
            <span className="row-value">{entradaDate} {entradaTime}</span>
          </div>

          {data.saida && (() => {
            const saidaDt = new Date(data.saida);
            return (
              <div className="row">
                <span className="row-label">Saida:</span>
                <span className="row-value">{saidaDt.toLocaleDateString("pt-BR")} {saidaDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            );
          })()}

          {data.tempoTotal && (
            <div className="row">
              <span className="row-label">Permanencia:</span>
              <span className="row-value">{data.tempoTotal}</span>
            </div>
          )}

          <div className="row">
            <span className="row-label">Tabela:</span>
            <span className="row-value">{data.tipo_cliente === "mensalista" ? "Mensalista" : "Avulso"}</span>
          </div>

          {data.regraAplicada && (
            <div className="row">
              <span className="row-label">Cobranca:</span>
              <span className="row-value">{data.regraAplicada.toUpperCase()}</span>
            </div>
          )}

          <div className="row">
            <span className="row-label">Valor/hora:</span>
            <span className="row-value-money">R$ {formatCurrency(data.valorHora || 10)}</span>
          </div>

          {data.formaPagamento && (
            <div className="row">
              <span className="row-label">Pagamento:</span>
              <span className="row-value">{data.formaPagamento.toUpperCase()}</span>
            </div>
          )}

          <div className="dashed"></div>

          {data.saida && data.valorTotal != null && (
            <>
              <div className="total-label">TOTAL</div>
              <div className="total-value">R$ {formatCurrency(data.valorTotal)}</div>
              <div className="dashed"></div>
            </>
          )}

          {!isSaida && (
            <>
              <div className="payment-highlight">PAGAMENTO DINHEIRO OU PIX</div>

              {data.qrCodeUrl && (
                <div className="qr-container">
                  <img src={data.qrCodeUrl} alt="QR Code PIX" crossOrigin="anonymous" />
                </div>
              )}

              {!data.qrCodeUrl && pixCode && (
                <div className="qr-container">
                  <QRCodeCanvas value={pixCode} size={100} level="M" includeMargin={false} />
                </div>
              )}

              <div className="payment-highlight">PAGAMENTO DINHEIRO OU PIX</div>
              <div className="dashed"></div>
            </>
          )}

          <div className="footer">{data.mensagemComprovante || "AGRADECEMOS A PREFERENCIA"}</div>
          {data.endereco && <div className="footer-addr">{data.endereco.toUpperCase()}</div>}
          {data.telefone && <div className="footer-addr">MEU CONTATO: {data.telefone}</div>}
          {data.cnpj && <div className="footer-addr">CNPJ: {data.cnpj}</div>}
        </div>
      </div>
    </div>
  );
}
