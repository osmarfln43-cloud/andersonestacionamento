/**
 * Realce de imagem "infravermelho simulado" para leitura de placas à noite.
 * Converte para escala de cinza, aplica correção de gama, alonga o histograma
 * e reforça o contraste local — o que a placa refletiva precisa para o OCR.
 */

export const isNightTime = (date: Date = new Date()): boolean => {
  const h = date.getHours();
  return h >= 18 || h < 6;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export interface NightEnhanceOptions {
  gamma?: number;
  maxWidth?: number;
  quality?: number;
}

/**
 * Recebe um dataURL (jpeg/png) e devolve um dataURL realçado para OCR noturno.
 */
export async function enhanceForNightPlate(
  dataUrl: string,
  { gamma = 0.65, maxWidth = 1000, quality = 0.85 }: NightEnhanceOptions = {}
): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = frame.data;
    const gray = new Uint8ClampedArray(px.length / 4);

    // 1. luminância + gama (clareia sombras)
    const gammaLUT = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      gammaLUT[i] = Math.round(255 * Math.pow(i / 255, gamma));
    }
    const hist = new Uint32Array(256);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const v = gammaLUT[Math.round(lum)];
      gray[j] = v;
      hist[v]++;
    }

    // 2. alongamento de histograma ignorando 1% das pontas (ruído noturno)
    const total = gray.length;
    const cut = Math.max(1, Math.round(total * 0.01));
    let acc = 0;
    let low = 0;
    let high = 255;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc > cut) { low = v; break; }
    }
    acc = 0;
    for (let v = 255; v >= 0; v--) {
      acc += hist[v];
      if (acc > cut) { high = v; break; }
    }
    if (high - low < 8) { low = 0; high = 255; }

    // 3. contraste final em S-curve suave
    const range = high - low;
    const finalLUT = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      const norm = Math.min(1, Math.max(0, (v - low) / range));
      const boosted = norm < 0.5
        ? 0.5 * Math.pow(norm * 2, 1.25)
        : 1 - 0.5 * Math.pow((1 - norm) * 2, 1.25);
      finalLUT[v] = Math.round(boosted * 255);
    }

    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      const v = finalLUT[gray[j]];
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
    }
    ctx.putImageData(frame, 0, 0);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}
