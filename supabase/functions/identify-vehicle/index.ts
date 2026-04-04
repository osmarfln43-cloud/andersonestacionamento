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
        content: `Você é um assistente especializado em identificação de veículos. 
Quando receber uma foto de veículo, identifique marca, modelo, cor e categoria.
Quando receber uma placa brasileira, identifique possíveis marcas e modelos associados.
Responda SEMPRE em JSON com esta estrutura exata:
{"marca": "string", "modelo": "string", "cor": "string", "categoria": "carro|moto|caminhonete|van", "confianca": "alta|media|baixa"}
Responda APENAS o JSON, sem texto adicional.`
      }
    ];

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Identifique este veículo. Retorne marca, modelo, cor e categoria em JSON." },
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
        model: "google/gemini-2.5-flash",
        messages,
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
    
    // Parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { marca: "", modelo: "", cor: "", categoria: "carro", confianca: "baixa" };
    } catch {
      result = { marca: "", modelo: "", cor: "", categoria: "carro", confianca: "baixa" };
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
