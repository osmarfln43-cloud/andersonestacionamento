import { useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import pixQrFallback from "@/assets/pix-qr-fallback.jpg";

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
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const timeout = setTimeout(() => generatePDF(), 800);
    return () => clearTimeout(timeout);
  }, [data]);

  const generatePDF = async () => {
    if (!data) return;

    let qrImageData: string | null = null;

    // 1) Try uploaded QR image
    if (data.qrCodeUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load QR image'));
          img.src = data.qrCodeUrl!;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        qrImageData = canvas.toDataURL('image/png');
      } catch {
        // fallback below
      }
    }

    // 2) Try generated QR canvas (from chavePix)
    if (!qrImageData && data.chavePix) {
      const qrCanvas = qrRef.current?.querySelector("canvas");
      if (qrCanvas) {
        qrImageData = (qrCanvas as HTMLCanvasElement).toDataURL('image/png');
      }
    }

    // 3) Fallback: load the bundled fallback image
    if (!qrImageData) {
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load fallback QR'));
          img.src = pixQrFallback;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        qrImageData = canvas.toDataURL('image/png');
      } catch {
        // no QR at all
      }
    }

    // First pass: calculate height
    const calcDoc = new jsPDF({ unit: "mm", format: [80, 500] });
    const finalHeight = renderContent(calcDoc, data, qrImageData);

    // Second pass: create with exact height
    const doc = new jsPDF({ unit: "mm", format: [80, finalHeight + 5] });
    renderContent(doc, data, qrImageData);

    const tipoLabel = data.saida ? 'saida' : 'entrada';
    const filename = `comprovante-${data.placa}-${tipoLabel}-${Date.now()}.pdf`;
    doc.save(filename);
    onDone();
  };

  const renderContent = (doc: jsPDF, data: ReceiptData, qrImageData: string | null): number => {
    const w = 80;
    let y = 6;

    const center = (text: string, yPos: number, size = 10, style: "normal" | "bold" = "normal") => {
      doc.setFontSize(size);
      doc.setFont("courier", style);
      const tw = doc.getTextWidth(text);
      doc.text(text, (w - tw) / 2, yPos);
    };

    const centerWrap = (text: string, yPos: number, size = 8, style: "normal" | "bold" = "normal") => {
      doc.setFontSize(size);
      doc.setFont("courier", style);
      const maxW = w - 10;
      const lines = doc.splitTextToSize(text, maxW);
      for (const l of lines) {
        const tw = doc.getTextWidth(l);
        doc.text(l, (w - tw) / 2, yPos);
        yPos += size * 0.45;
      }
      return yPos;
    };

    const leftRight = (left: string, right: string, yPos: number, size = 8, style: "normal" | "bold" = "normal") => {
      doc.setFontSize(size);
      doc.setFont("courier", style);
      doc.text(left, 5, yPos);
      const rw = doc.getTextWidth(right);
      doc.text(right, w - 5 - rw, yPos);
    };

    const dashed = (yPos: number) => {
      doc.setDrawColor(0);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(3, yPos, w - 3, yPos);
    };

    // ========== HEADER ==========
    center(data.nomeEstacionamento || "ME PARK ESTACIONAMENTO", y, 11, "bold");
    y += 6;
    dashed(y); y += 4;

    // Disclaimer
    const disclaimer = data.disclaimerComprovante || "NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO";
    const horarios = `HORARIO DE FUNCIONAMENTO ${(data.diasFuncionamento || "SEGUNDA A SEXTA").toUpperCase()} DAS ${data.horarioAbertura || "07:00"} ATE AS ${data.horarioFechamento || "19:00"}`;
    y = centerWrap(`${disclaimer}. ${horarios}`, y, 6, "normal");
    y += 3;
    dashed(y); y += 5;

    // ========== PLATE (big) ==========
    center(data.placa, y, 20, "bold");
    y += 6;

    // Vehicle info below plate
    const veiculoLine = `(${(data.modelo || "N/I").toUpperCase()} ${(data.cor || "").toUpperCase()})`.trim();
    center(veiculoLine, y, 9, "bold");
    y += 6;
    dashed(y); y += 5;

    // ========== DETAILS ==========
    const entradaDt = new Date(data.entrada);
    const entradaDate = entradaDt.toLocaleDateString("pt-BR");
    const entradaTime = entradaDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    leftRight("Entrada:", `${entradaDate} as ${entradaTime}`, y, 8);
    y += 5;

    if (data.saida) {
      const saidaDt = new Date(data.saida);
      const saidaDate = saidaDt.toLocaleDateString("pt-BR");
      const saidaTime = saidaDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      leftRight("Saida:", `${saidaDate} as ${saidaTime}`, y, 8);
      y += 5;
    }

    if (data.tempoTotal) {
      leftRight("Permanencia:", data.tempoTotal, y, 8);
      y += 5;
    }

    leftRight("Tabela:", data.tipo_cliente === "mensalista" ? "Mensalista" : "Avulso", y, 8);
    y += 5;

    // Payment method
    if (data.formaPagamento) {
      leftRight("Pagamento:", data.formaPagamento.toUpperCase(), y, 8, "bold");
      y += 5;
    }

    leftRight("Valor/hora:", `R$ ${Number(data.valorHora || 10).toFixed(2)}`, y, 8);
    y += 5;

    dashed(y); y += 5;

    // ========== TOTAL ==========
    if (data.saida && data.valorTotal != null) {
      center("Total", y, 12, "bold");
      y += 6;
      center(`R$ ${Number(data.valorTotal).toFixed(2)}`, y, 16, "bold");
      y += 7;
      dashed(y); y += 5;
    }

    // ========== PAYMENT HIGHLIGHT (above QR) ==========
    center("PAGAMENTO DINHEIRO OU PIX", y, 12, "bold");
    y += 6;

    // ========== QR CODE ==========
    if (qrImageData) {
      const qrSize = 28;
      doc.addImage(qrImageData, "PNG", (w - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 3;
    }

    // ========== PAYMENT HIGHLIGHT (below QR) ==========
    center("PAGAMENTO DINHEIRO OU PIX", y, 12, "bold");
    y += 6;
    dashed(y); y += 4;

    // ========== FOOTER ==========
    center(data.mensagemComprovante || "ME PARK AGRADECE A PREFERENCIA", y, 7, "bold");
    y += 4;

    if (data.endereco) {
      center(data.endereco.toUpperCase(), y, 6, "normal");
      y += 3;
    }

    y += 3;
    return y;
  };

  if (!data) return null;

  const pixCode = data.chavePix
    ? `00020126580014br.gov.bcb.pix0136${data.chavePix}5204000053039865802BR5913ME PARK AI6008SAOPAULO`
    : "";

  return (
    <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
      <div ref={qrRef}>
        {pixCode && (
          <QRCodeCanvas
            value={pixCode}
            size={256}
            level="M"
            includeMargin
          />
        )}
      </div>
    </div>
  );
}
