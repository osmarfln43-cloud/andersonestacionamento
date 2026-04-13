import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, placa } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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
Para a placa, retorne apenas letras e números sem traço (ex: ABC1D23). Se não conseguir ler a placa, retorne "".`
      }
    ];

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Identifique este veículo. Leia a placa e retorne marca, modelo, cor, categoria e placa em JSON." },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    } else if (placa) {
      messages.push({
        role: "user",
        content: `A placa do veículo é: ${placa}. Com base no padrão de placas brasileiras e conhecimento geral, sugira a marca e modelo mais provável. Retorne em JSON.`
      });
    } else {
      return new Response(JSON.stringify({ error: "Envie 'image' (base64) ou 'placa'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: image ? "google/gemini-2.5-flash-lite" : "google/gemini-2.5-flash-lite",
        messages,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Clean plate: only letters and numbers, uppercase
    if (result.placa) {
      result.placa = result.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
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
