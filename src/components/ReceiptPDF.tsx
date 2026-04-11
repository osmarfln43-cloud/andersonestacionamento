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
}

interface Props {
  data: ReceiptData | null;
  onDone: () => void;
}

export default function ReceiptPDF({ data, onDone }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const timeout = setTimeout(() => printReceipt(), 600);
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
      }, printerConfig.paperWidth);

      const success = await printViaUSB(escposData);
      if (success) {
        onDone();
        return;
      }
      // Fall through to browser print if USB fails
    }

    const printContent = printRef.current.innerHTML;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (!printWindow) {
      // Fallback: use iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '80mm';
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
          }, 1000);
        }, 400);
      }
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHTML(printContent));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
        onDone();
      }, 1000);
    }, 400);
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
          font-size: 12px;
          width: 80mm;
          padding: 3mm;
          color: #000;
          background: #fff;
        }
        .receipt { width: 100%; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 4px; }
        .plate { font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 3px; margin: 6px 0 2px; }
        .vehicle-info { font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 4px; }
        .dashed { border-top: 1px dashed #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
        .row-label { }
        .row-value { font-weight: bold; }
        .total-label { font-size: 14px; font-weight: bold; text-align: center; margin-top: 4px; }
        .total-value { font-size: 20px; font-weight: bold; text-align: center; margin: 2px 0; }
        .payment-highlight { font-size: 14px; font-weight: bold; text-align: center; margin: 4px 0; }
        .disclaimer { font-size: 8px; text-align: center; line-height: 1.3; margin: 2px 0; }
        .footer { font-size: 9px; text-align: center; font-weight: bold; margin-top: 4px; }
        .footer-addr { font-size: 8px; text-align: center; margin-top: 2px; }
        .qr-container { text-align: center; margin: 6px 0; }
        .qr-container img, .qr-container canvas { width: 30mm !important; height: 30mm !important; }
        @media print {
          body { width: 80mm; }
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
    ? `00020126580014br.gov.bcb.pix0136${data.chavePix}5204000053039865802BR5913ME PARK AI6008SAOPAULO`
    : "";

  return (
    <div style={{ position: "fixed", left: "-9999px", top: "-9999px" }}>
      <div ref={printRef}>
        <div className="receipt">
          {/* Header */}
          <div className="title">{data.nomeEstacionamento || "ME PARK ESTACIONAMENTO"}</div>
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
          <div className="footer">{data.mensagemComprovante || "ME PARK AGRADECE A PREFERENCIA"}</div>
          {data.endereco && <div className="footer-addr">{data.endereco.toUpperCase()}</div>}
        </div>
      </div>
    </div>
  );
}
