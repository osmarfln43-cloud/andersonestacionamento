import { useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getSavedPrinterConfig, buildReceiptESCPOS, printViaUSB } from "@/lib/printer";

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
    const contentWidth = is58mm ? '50mm' : '72mm';
    const baseFontSize = is58mm ? '9px' : '11px';
    const rowFontSize = is58mm ? '9px' : '10px';
    const titleFontSize = is58mm ? '11px' : '13px';
    const plateFontSize = is58mm ? '18px' : '22px';
    const vehicleInfoFontSize = is58mm ? '9px' : '10px';
    const totalLabelFontSize = is58mm ? '11px' : '12px';
    const totalValueFontSize = is58mm ? '17px' : '20px';
    const paymentFontSize = is58mm ? '10px' : '11px';
    const disclaimerFontSize = is58mm ? '7px' : '8px';
    const footerFontSize = is58mm ? '8px' : '9px';
    const footerAddrFontSize = is58mm ? '7px' : '8px';
    const moneyFontSize = is58mm ? '12px' : '14px';
    const qrSize = is58mm ? '24mm' : '28mm';
    const letterSpacing = is58mm ? '1px' : '2px';

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
          font-size: ${baseFontSize};
          width: ${paperWidth};
          margin: 0 auto;
          padding: 1mm 0;
          color: #000 !important;
          background: #fff !important;
          line-height: 1.25;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .receipt {
          width: 100%;
          max-width: ${contentWidth};
          margin: 0 auto;
          color: #000 !important;
        }
        .title { font-size: ${titleFontSize}; font-weight: 900; text-align: center; margin-bottom: 2px; }
        .plate { font-size: ${plateFontSize}; font-weight: 900; text-align: center; letter-spacing: ${letterSpacing}; margin: 3px 0 1px; }
        .vehicle-info { font-size: ${vehicleInfoFontSize}; font-weight: 900; text-align: center; margin-bottom: 2px; overflow-wrap: anywhere; }
        .dashed { border-top: 1px dashed #000; margin: 3px 0; }
        .row {
          display: grid;
          grid-template-columns: max-content minmax(0, 1fr);
          align-items: start;
          gap: 2px 4px;
          padding: 2px 0;
          font-size: ${rowFontSize};
          width: 100%;
        }
        .row-label { font-weight: 700; white-space: nowrap; }
        .row-value {
          min-width: 0;
          font-weight: 900;
          text-align: right;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .row-value-money {
          min-width: 0;
          font-size: ${moneyFontSize};
          font-weight: 900;
          text-align: right;
          white-space: nowrap;
        }
        .total-label { font-size: ${totalLabelFontSize}; font-weight: 900; text-align: center; margin-top: 2px; }
        .total-value { font-size: ${totalValueFontSize}; font-weight: 900; text-align: center; margin: 1px 0; }
        .payment-highlight { font-size: ${paymentFontSize}; font-weight: 900; text-align: center; margin: 2px 0; }
        .disclaimer { font-size: ${disclaimerFontSize}; text-align: center; line-height: 1.2; margin: 1px 0; font-weight: 700; overflow-wrap: anywhere; }
        .footer { font-size: ${footerFontSize}; text-align: center; font-weight: 900; margin-top: 2px; overflow-wrap: anywhere; }
        .footer-addr { font-size: ${footerAddrFontSize}; text-align: center; margin-top: 1px; font-weight: 700; overflow-wrap: anywhere; }
        .qr-container { text-align: center; margin: 3px 0; }
        .qr-container img, .qr-container canvas { width: ${qrSize} !important; height: ${qrSize} !important; }
        .regra-box { font-size: 11px; font-weight: 900; text-align: center; border: 1px solid #000; padding: 2px 4px; margin: 2px auto; display: inline-block; }
        @media print {
          html, body { width: ${paperWidth}; margin: 0 auto; }
          .receipt { max-width: ${contentWidth}; }
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
            <span className="row-value-money">R$ {Number(data.valorHora || 10).toFixed(2).replace('.', ',')}</span>
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
              <div className="total-value">R$ {Number(data.valorTotal).toFixed(2).replace('.', ',')}</div>
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
