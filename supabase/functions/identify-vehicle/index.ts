import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const PLATE_RECOGNIZER_API_KEY = Deno.env.get("PLATE_RECOGNIZER_API_KEY");

async function recognizePlateWithPlateRecognizer(imageBase64: string): Promise<string | null> {
  if (!PLATE_RECOGNIZER_API_KEY) return null;

  try {
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/jpeg" });

    const form = new FormData();
    form.append("upload", blob, "plate.jpg");

    const response = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
      method: "POST",
      headers: {
        Authorization: `Token ${PLATE_RECOGNIZER_API_KEY}`,
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Plate Recognizer error:", response.status, text);
      return null;
    }

    const data = await response.json();
    const results = data?.results || [];
    if (!Array.isArray(results) || results.length === 0) return null;

    // Pega a placa com maior confiança
    const best = results.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];
    const plate = best?.plate?.toString().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
    return plate && plate.length >= 6 ? plate : null;
  } catch (err) {
    console.error("Plate Recognizer exception:", err);
    return null;
  }
}

async function identifyWithAI(image: string | null, placa: string | null): Promise<any> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const messages: any[] = [
    {
      role: "system",
      content: `Você é um assistente especializado em identificação de veículos e leitura de placas.
Quando receber uma foto de veículo:
1. Leia a placa visível na foto (formato brasileiro antigo ABC-1234 ou Mercosul ABC1D23)
2. Identifique marca, modelo, cor e categoria do veículo
Quando receber apenas uma placa brasileira, identifique possíveis marcas e modelos.
Responda SEMPRE em JSON com esta estrutura exata:
{"placa": "string ou vazio se não conseguir ler", "marca": "string", "modelo": "string", "cor": "string", "categoria": "carro|moto|caminhonete|van", "confianca": "alta|media|baixa"}
Responda APENAS o JSON, sem texto adicional.
Para a placa, retorne apenas letras e números sem traço (ex: ABC1D23). Se não conseguir ler a placa, retorne "".`,
    },
  ];

  if (image) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: placa ? `A placa já identificada é ${placa}. Confirme e complete marca, modelo, cor e categoria em JSON.` : "Identifique este veículo. Leia a placa e retorne marca, modelo, cor, categoria e placa em JSON." },
        { type: "image_url", image_url: { url: image } },
      ],
    });
  } else if (placa) {
    messages.push({
      role: "user",
      content: `A placa do veículo é: ${placa}. Com base no padrão de placas brasileiras e conhecimento geral, sugira a marca e modelo mais provável. Retorne em JSON.`,
    });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Limite de requisições excedido. Tente novamente.");
    }
    if (response.status === 402) {
      throw new Error("Créditos insuficientes.");
    }
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    throw new Error("Erro no serviço de IA");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  let result;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { placa: "", marca: "", modelo: "", cor: "", categoria: "carro", confianca: "baixa" };
  } catch {
    result = { placa: "", marca: "", modelo: "", cor: "", categoria: "carro", confianca: "baixa" };
  }

  if (result.placa) {
    result.placa = result.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7);
  }

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

    // Se houver imagem, tenta ler a placa com Plate Recognizer primeiro
    let plateFromImage: string | null = null;
    if (image) {
      plateFromImage = await recognizePlateWithPlateRecognizer(image);
      if (plateFromImage) {
        console.log("Plate Recognizer leu placa:", plateFromImage);
      }
    }

    // Se a placa foi lida pela imagem, usa a IA apenas para completar detalhes do veículo.
    // Se não leu, a IA faz a leitura completa (placa + detalhes).
    const result = await identifyWithAI(image, plateFromImage || placa);

    // Se Plate Recognizer leu a placa, prefere essa leitura sobre a da IA
    if (plateFromImage) {
      result.placa = plateFromImage;
      result.source = "plate-recognizer";
    } else if (image) {
      result.source = "ai";
    } else {
      result.source = "ai";
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
