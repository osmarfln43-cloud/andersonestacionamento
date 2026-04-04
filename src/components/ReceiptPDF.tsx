import { useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import logoQrcode from "@/assets/logo-qrcode.jpg";

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
  tipo: "entrada" | "saida";
}

interface Props {
  data: ReceiptData | null;
  onDone: () => void;
}

export default function ReceiptPDF({ data, onDone }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!data) return;
    const timeout = setTimeout(() => generatePDF(), 600);
    return () => clearTimeout(timeout);
  }, [data]);

  const generatePDF = async () => {
    if (!data) return;

    const doc = new jsPDF({ unit: "mm", format: [80, 250] });
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

    // Logo at top
    try {
      const logoImg = logoRef.current;
      if (logoImg && logoImg.complete) {
        const canvas = document.createElement("canvas");
        canvas.width = logoImg.naturalWidth;
        canvas.height = logoImg.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(logoImg, 0, 0);
        const logoData = canvas.toDataURL("image/jpeg");
        const logoSize = 15;
        doc.addImage(logoData, "JPEG", (w - logoSize) / 2, y, logoSize, logoSize);
        y += logoSize + 2;
      }
    } catch {}

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
    const title = data.tipo === "saida" ? "COMPROVANTE DE SAÍDA" : "COMPROVANTE DE ENTRADA";
    center(title, y, 10, "bold");
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
    leftRight("Entrada:", entrada.toLocaleString("pt-BR"), y); y += 5;

    if (data.tipo === "saida" && data.saida) {
      const saida = new Date(data.saida);
      leftRight("Saída:", saida.toLocaleString("pt-BR"), y); y += 5;
    }

    if (data.tempoTotal) {
      leftRight("Permanência:", data.tempoTotal, y); y += 5;
    }

    if (data.valorHora) {
      leftRight("Valor/hora:", `R$ ${Number(data.valorHora).toFixed(2)}`, y); y += 5;
    }

    line(y); y += 5;

    // Payment info (saida only)
    if (data.tipo === "saida" && data.valorTotal != null) {
      // Draw highlighted box for total
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(6, y - 2, w - 12, 18, 1, 1, "F");

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const totalText = `TOTAL: R$ ${Number(data.valorTotal).toFixed(2)}`;
      const ttw = doc.getTextWidth(totalText);
      doc.text(totalText, (w - ttw) / 2, y + 5);
      y += 10;

      if (data.formaPagamento) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const pagText = `PAGAMENTO: ${data.formaPagamento.toUpperCase()}`;
        const ptw = doc.getTextWidth(pagText);
        doc.text(pagText, (w - ptw) / 2, y + 2);
        y += 8;
      }
      y += 4;
    }

    // QR Code PIX
    if (data.chavePix) {
      center("PAGUE VIA PIX", y, 9, "bold");
      y += 5;

      const qrCanvas = qrRef.current?.querySelector("canvas");
      if (qrCanvas) {
        const qrData = (qrCanvas as HTMLCanvasElement).toDataURL("image/png");
        const qrSize = 32;
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

    // Resize page
    doc.internal.pageSize.height = y + 5;

    // Print or download
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);

    try {
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => printWindow.print());
      } else {
        doc.save(`${data.tipo}-${data.placa}-${Date.now()}.pdf`);
      }
    } catch {
      doc.save(`${data.tipo}-${data.placa}-${Date.now()}.pdf`);
    }

    onDone();
  };

  if (!data) return null;

  return (
    <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
      <div ref={qrRef}>
        {data.chavePix && (
          <QRCodeCanvas
            value={data.chavePix}
            size={256}
            level="M"
            includeMargin
          />
        )}
      </div>
      <img
        ref={logoRef}
        src={logoQrcode}
        alt=""
        crossOrigin="anonymous"
        style={{ width: 100, height: 100 }}
      />
    </div>
  );
}
