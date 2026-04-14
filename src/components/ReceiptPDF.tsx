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

    // Try USB direct printing first
    const printerConfig = getSavedPrinterConfig();
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
        cnpj: data.cnpj,
      }, printerConfig.paperWidth);

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
    iframe.style.width = '80mm';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(buildPrintHTML(printContent));
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

  const buildPrintHTML = (content: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprovante</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          width: 80mm;
          padding: 3mm;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .receipt { width: 100%; color: #000 !important; }
        .center { text-align: center; }
        .bold { font-weight: 900; }
        .title { font-size: 16px; font-weight: 900; text-align: center; margin-bottom: 4px; color: #000 !important; }
        .plate { font-size: 28px; font-weight: 900; text-align: center; letter-spacing: 3px; margin: 6px 0 2px; color: #000 !important; }
        .vehicle-info { font-size: 12px; font-weight: 900; text-align: center; margin-bottom: 4px; color: #000 !important; }
        .dashed { border-top: 2px dashed #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; color: #000 !important; }
        .row-label { font-weight: 700; }
        .row-value { font-weight: 900; }
        .total-label { font-size: 16px; font-weight: 900; text-align: center; margin-top: 4px; color: #000 !important; }
        .total-value { font-size: 24px; font-weight: 900; text-align: center; margin: 2px 0; color: #000 !important; }
        .payment-highlight { font-size: 16px; font-weight: 900; text-align: center; margin: 4px 0; color: #000 !important; }
        .disclaimer { font-size: 9px; text-align: center; line-height: 1.3; margin: 2px 0; font-weight: 700; color: #000 !important; }
        .footer { font-size: 10px; text-align: center; font-weight: 900; margin-top: 4px; color: #000 !important; }
        .footer-addr { font-size: 9px; text-align: center; margin-top: 2px; font-weight: 700; color: #000 !important; }
        .qr-container { text-align: center; margin: 6px 0; }
        .qr-container img, .qr-container canvas { width: 35mm !important; height: 35mm !important; }
        @media print {
          body { width: 80mm; color: #000 !important; }
          * { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>/* auto-focus for print */</script>
    </body>
    </html>
  `;

  if (!data) return null;

  const entradaDt = new Date(data.entrada);
  const entradaDate = entradaDt.toLocaleDateString("pt-BR");
  const entradaTime = entradaDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const disclaimer = data.disclaimerComprovante || "NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO";
  const horarios = `HORARIO DE FUNCIONAMENTO ${(data.diasFuncionamento || "SEGUNDA A SEXTA").toUpperCase()} DAS ${data.horarioAbertura || "07:00"} ATE AS ${data.horarioFechamento || "19:00"}`;

  const pixCode = data.chavePix
    ? `00020126580014br.gov.bcb.pix0136${data.chavePix}5204000053039865802BR5925ANDERSON ESTACIONAMENTO6008SAOPAULO`
    : "";

  return (
    <div style={{ position: "fixed", left: "-9999px", top: "-9999px" }}>
      <div ref={printRef}>
        <div className="receipt">
          {/* Header */}
          <div className="title">{data.nomeEstacionamento || "ANDERSON ESTACIONAMENTO"}</div>
          <div className="dashed"></div>

          {/* Disclaimer */}
          <div className="disclaimer">{disclaimer}. {horarios}</div>
          <div className="dashed"></div>

          {/* Plate */}
          <div className="plate">{data.placa}</div>
          <div className="vehicle-info">({(data.modelo || "N/I").toUpperCase()} {(data.cor || "").toUpperCase()})</div>
          <div className="dashed"></div>

          {/* Details */}
          <div className="row">
            <span className="row-label">Entrada:</span>
            <span className="row-value">{entradaDate} as {entradaTime}</span>
          </div>

          {data.saida && (() => {
            const saidaDt = new Date(data.saida);
            return (
              <div className="row">
                <span className="row-label">Saida:</span>
                <span className="row-value">{saidaDt.toLocaleDateString("pt-BR")} as {saidaDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
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

          {data.formaPagamento && (
            <div className="row">
              <span className="row-label">Pagamento:</span>
              <span className="row-value">{data.formaPagamento.toUpperCase()}</span>
            </div>
          )}

          <div className="row">
            <span className="row-label">Valor/hora:</span>
            <span className="row-value">R$ {Number(data.valorHora || 10).toFixed(2)}</span>
          </div>

          <div className="dashed"></div>

          {/* Total */}
          {data.saida && data.valorTotal != null && (
            <>
              <div className="total-label">Total</div>
              <div className="total-value">R$ {Number(data.valorTotal).toFixed(2)}</div>
              <div className="dashed"></div>
            </>
          )}

          {/* Payment highlight */}
          <div className="payment-highlight">PAGAMENTO DINHEIRO OU PIX</div>

          {/* QR Code */}
          {data.qrCodeUrl && (
            <div className="qr-container">
              <img src={data.qrCodeUrl} alt="QR Code PIX" crossOrigin="anonymous" />
            </div>
          )}

          {!data.qrCodeUrl && pixCode && (
            <div className="qr-container">
              <QRCodeCanvas value={pixCode} size={120} level="M" includeMargin />
            </div>
          )}

          <div className="payment-highlight">PAGAMENTO DINHEIRO OU PIX</div>
          <div className="dashed"></div>

          {/* Footer */}
          <div className="footer">{data.mensagemComprovante || "ANDERSON ESTACIONAMENTO AGRADECE A PREFERENCIA"}</div>
          {data.endereco && <div className="footer-addr">{data.endereco.toUpperCase()}</div>}
          {data.cnpj && <div className="footer-addr">CNPJ: {data.cnpj}</div>}
        </div>
      </div>
    </div>
  );
}
