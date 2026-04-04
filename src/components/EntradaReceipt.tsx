import { useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

interface ReceiptData {
  placa: string;
  modelo: string;
  cor: string;
  tipo_cliente: string;
  entrada: string;
  nomeEstacionamento?: string;
  endereco?: string;
  telefone?: string;
  chavePix?: string;
  tipoChavePix?: string;
  nomeBeneficiario?: string;
  mensagemComprovante?: string;
  valorHora?: number;
}

interface Props {
  data: ReceiptData | null;
  onDone: () => void;
}

export default function EntradaReceipt({ data, onDone }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const timeout = setTimeout(() => generatePDF(), 500);
    return () => clearTimeout(timeout);
  }, [data]);

  const generatePDF = async () => {
    if (!data) return;

    const doc = new jsPDF({ unit: "mm", format: [80, 200] });
    const w = 80;
    let y = 8;

    const center = (text: string, yPos: number, size = 10, style: "normal" | "bold" = "normal") => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      const tw = doc.getTextWidth(text);
      doc.text(text, (w - tw) / 2, yPos);
    };

    const leftRight = (left: string, right: string, yPos: number, size = 8) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", "normal");
      doc.text(left, 4, yPos);
      const rw = doc.getTextWidth(right);
      doc.text(right, w - 4 - rw, yPos);
    };

    const line = (yPos: number) => {
      doc.setDrawColor(180);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(4, yPos, w - 4, yPos);
    };

    // Header
    center(data.nomeEstacionamento || "ME PARK AI", y, 14, "bold");
    y += 5;
    center("Estacionamento Inteligente", y, 7);
    y += 4;
    if (data.endereco) { center(data.endereco, y, 6); y += 3; }
    if (data.telefone) { center(`Tel: ${data.telefone}`, y, 6); y += 3; }
    y += 1;
    line(y); y += 5;

    // Title
    center("COMPROVANTE DE ENTRADA", y, 10, "bold");
    y += 7;
    line(y); y += 5;

    // Plate highlight
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.roundedRect(10, y, w - 20, 14, 2, 2);
    center(data.placa, y + 10, 18, "bold");
    y += 20;

    // Vehicle info
    leftRight("Veículo:", data.modelo || "N/I", y); y += 5;
    leftRight("Cor:", data.cor || "N/I", y); y += 5;
    leftRight("Tipo:", data.tipo_cliente === "mensalista" ? "Mensalista" : "Avulso", y); y += 5;

    line(y); y += 5;

    // Date/time
    const entrada = new Date(data.entrada);
    leftRight("Data:", entrada.toLocaleDateString("pt-BR"), y); y += 5;
    leftRight("Hora:", entrada.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), y); y += 5;
    if (data.valorHora) {
      leftRight("Valor/hora:", `R$ ${Number(data.valorHora).toFixed(2)}`, y); y += 5;
    }

    line(y); y += 5;

    // QR Code PIX
    if (data.chavePix) {
      center("PAGUE VIA PIX", y, 9, "bold");
      y += 5;

      // Get QR code as image
      const qrCanvas = qrRef.current?.querySelector("canvas");
      if (qrCanvas) {
        const qrData = (qrCanvas as HTMLCanvasElement).toDataURL("image/png");
        const qrSize = 30;
        doc.addImage(qrData, "PNG", (w - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 3;
      }

      center(`Chave: ${data.chavePix}`, y, 6); y += 3;
      if (data.nomeBeneficiario) {
        center(data.nomeBeneficiario, y, 6); y += 3;
      }
      y += 2;
      line(y); y += 5;
    }

    // Footer
    center(data.mensagemComprovante || "Obrigado pela preferência!", y, 7);
    y += 4;
    center(`Emitido: ${new Date().toLocaleString("pt-BR")}`, y, 5);
    y += 6;

    // Resize page to content
    const pageHeight = y + 5;
    doc.internal.pageSize.height = pageHeight;

    // Try to print, fallback to download
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);

    try {
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      } else {
        doc.save(`entrada-${data.placa}-${Date.now()}.pdf`);
      }
    } catch {
      doc.save(`entrada-${data.placa}-${Date.now()}.pdf`);
    }

    onDone();
  };

  if (!data) return null;

  // Hidden QR code canvas for PDF generation
  return (
    <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} ref={qrRef}>
      {data.chavePix && (
        <QRCodeCanvas
          value={data.chavePix}
          size={256}
          level="M"
          includeMargin
        />
      )}
    </div>
  );
}
