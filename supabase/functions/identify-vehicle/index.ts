import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const PLATE_RECOGNIZER_API_KEY = Deno.env.get("PLATE_RECOGNIZER_API_KEY");

interface AlprResult {
  placa: string | null;
  marca: string;
  modelo: string;
  cor: string;
  categoria: string;
}

const COLOR_PT: Record<string, string> = {
  white: "Branco", black: "Preto", silver: "Prata", gray: "Cinza", grey: "Cinza",
  red: "Vermelho", blue: "Azul", green: "Verde", yellow: "Amarelo", orange: "Laranja",
  brown: "Marrom", beige: "Bege", gold: "Dourado", purple: "Roxo", pink: "Rosa", tan: "Bege",
};

const CATEGORY_PT: Record<string, string> = {
  car: "carro", sedan: "carro", hatchback: "carro", wagon: "carro", coupe: "carro",
  suv: "carro", "suv/crossover": "carro", "big truck": "caminhonete",
  motorcycle: "moto", motorbike: "moto", scooter: "moto", bicycle: "moto",
  "pickup truck": "caminhonete", truck: "caminhonete",
  van: "van", minivan: "van", bus: "van",
};

/** Traduz o tipo do ALPR; devolve "" quando o tipo não veio ou não é confiável. */
function mapVehicleType(type?: string | null, score?: number | null): string {
  if (!type) return "";
  if (typeof score === "number" && score < 0.25) return "";
  return CATEGORY_PT[String(type).toLowerCase().trim()] || "";
}

/** Plate Recognizer com MMC (make, model, color) — leitura real, sem inferência. */
async function readWithPlateRecognizer(imageBase64: string): Promise<AlprResult | null> {
  if (!PLATE_RECOGNIZER_API_KEY) return null;

  try {
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/jpeg" });

    const form = new FormData();
    form.append("upload", blob, "plate.jpg");
    form.append("mmc", "true");
    form.append("regions", "br");

    const response = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
      method: "POST",
      headers: { Authorization: `Token ${PLATE_RECOGNIZER_API_KEY}` },
      body: form,
    });

    if (!response.ok) {
      console.error("Plate Recognizer error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    const best = results.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];
    const plate = best?.plate?.toString().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);

    const mmc = Array.isArray(best?.model_make) ? best.model_make[0] : null;
    const colorRaw = Array.isArray(best?.color) ? best.color[0]?.color : null;
    const vehicleType = best?.vehicle?.type as string | undefined;
    const vehicleScore = best?.vehicle?.score as number | undefined;

    const marca = mmc?.make ? String(mmc.make).replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
    const modelo = mmc?.model ? String(mmc.model).replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
    const cor = colorRaw ? (COLOR_PT[String(colorRaw).toLowerCase()] || String(colorRaw)) : "";
    const categoria = mapVehicleType(vehicleType, vehicleScore);

    return {
      placa: plate && plate.length >= 6 ? plate : null,
      marca,
      modelo,
      cor,
      categoria,
    };
  } catch (err) {
    console.error("Plate Recognizer exception:", err);
    return null;
  }
}

/** Visão computacional (IA) apenas quando há foto real — nunca inventa a partir da placa. */
async function identifyWithAI(image: string, placa: string | null): Promise<any> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const messages: any[] = [
    {
      role: "system",
      content: `Você lê placas brasileiras e identifica veículos (carros e motos) em fotos.
Use SOMENTE o que estiver visível na imagem. Nunca invente marca, modelo ou cor: se não estiver claro na foto, devolva string vazia.
A categoria é OBRIGATÓRIA e deve ser decidida pela imagem, nunca pelo texto da placa:
- "moto" quando houver duas rodas, guidão, garupa, escapamento lateral, ou quando a placa for pequena/quadrada montada atrás sem para-choque;
- "carro" quando houver quatro rodas, para-choque, faróis do carro, placa retangular larga;
- "caminhonete" para picapes com caçamba; "van" para furgões e micro-ônibus.
Se a imagem realmente não permitir decidir, use categoria "" (vazio).
Responda SEMPRE apenas este JSON:
{"placa":"","marca":"","modelo":"","cor":"","categoria":"carro|moto|caminhonete|van|","confianca":"alta|media|baixa"}
Para a placa devolva só letras e números (ex: ABC1D23).`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: placa
            ? `A placa já lida por ALPR é ${placa}. Diga a categoria (moto ou carro) olhando o veículo da foto e complete marca, modelo e cor SOMENTE se visíveis.`
            : "Leia a placa e identifique marca, modelo, cor e diga se é moto ou carro, pelo veículo visível na foto.",
        },
        { type: "image_url", image_url: { url: image } },
      ],
    },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, max_tokens: 200 }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Limite de requisições excedido. Tente novamente.");
    if (response.status === 402) throw new Error("Créditos insuficientes.");
    console.error("AI gateway error:", response.status, await response.text());
    throw new Error("Erro no serviço de IA");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  let result: any;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    result = {};
  }
  result.placa = result.placa ? String(result.placa).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7) : "";
  result.marca = result.marca || "";
  result.modelo = result.modelo || "";
  result.cor = result.cor || "";
  const catRaw = String(result.categoria || "").toLowerCase().trim();
  result.categoria = ["carro", "moto", "caminhonete", "van"].includes(catRaw) ? catRaw : (CATEGORY_PT[catRaw] || "");
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, placa } = await req.json();

    if (!image && !placa) {
      return new Response(JSON.stringify({ error: "Envie 'image' (base64) ou 'placa'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sem foto não há como identificar o veículo sem adivinhar: devolve vazio.
    if (!image) {
      return new Response(
        JSON.stringify({
          placa: String(placa).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7),
          marca: "", modelo: "", cor: "", categoria: "", confianca: "baixa",
          source: "none",
          message: "Identificação de marca/modelo/cor exige foto do veículo.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const alpr = await readWithPlateRecognizer(image);
    if (alpr) {
      console.log("ALPR:", alpr.placa, alpr.marca, alpr.modelo, alpr.cor, alpr.categoria);
    }

    let result: any = {
      placa: alpr?.placa || "",
      marca: alpr?.marca || "",
      modelo: alpr?.modelo || "",
      cor: alpr?.cor || "",
      categoria: alpr?.categoria || "",
      confianca: alpr?.placa ? "alta" : "baixa",
      source: alpr?.placa ? "plate-recognizer" : "ai",
    };

    // Completa somente o que o ALPR não trouxe (inclusive moto x carro), usando a própria foto.
    const faltaDados = !result.placa || !result.modelo || !result.cor || !result.categoria;
    if (faltaDados) {
      try {
        const ai = await identifyWithAI(image, alpr?.placa || placa || null);
        result = {
          ...result,
          placa: result.placa || ai.placa || "",
          marca: result.marca || ai.marca || "",
          modelo: result.modelo || ai.modelo || "",
          cor: result.cor || ai.cor || "",
          categoria: result.categoria || ai.categoria || "",
          confianca: result.placa ? result.confianca : (ai.confianca || "baixa"),
          source: alpr?.placa ? "plate-recognizer+ai" : "ai",
        };
      } catch (aiErr) {
        console.error("AI complement failed:", aiErr);
        if (!result.placa) throw aiErr;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
