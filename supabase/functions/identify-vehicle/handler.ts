const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlateResult {
  plate?: string;
  score?: number;
  model_make?: { make?: string; model?: string }[];
  color?: { color?: string }[];
  vehicle?: { type?: string; score?: number };
}

interface Dependencies {
  authorize: (req: Request) => Promise<401 | 403 | null>;
  apiKey?: string;
  includeMMC?: boolean;
  fetcher?: typeof fetch;
}

const colorPt: Record<string, string> = {
  white: "Branco", black: "Preto", silver: "Prata", gray: "Cinza", grey: "Cinza",
  red: "Vermelho", blue: "Azul", green: "Verde", yellow: "Amarelo", orange: "Laranja",
  brown: "Marrom", beige: "Bege", gold: "Dourado", purple: "Roxo", pink: "Rosa", tan: "Bege",
};
const categoryPt: Record<string, string> = {
  car: "carro", sedan: "carro", hatchback: "carro", wagon: "carro", coupe: "carro",
  suv: "carro", "suv/crossover": "carro", "big truck": "caminhonete",
  motorcycle: "moto", motorbike: "moto", scooter: "moto",
  "pickup truck": "caminhonete", truck: "caminhonete",
  van: "van", minivan: "van", bus: "van",
};
const emptyVehicle = { placa: "", marca: "", modelo: "", cor: "", categoria: "", confianca: "baixa" };
const textValue = (value: unknown) => typeof value === "string" ? value.trim() : "";
const titleCase = (value: unknown) => textValue(value).replace(/\b\w/g, c => c.toUpperCase());
const normalPlate = (value: unknown) => textValue(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
const validPlate = (value: unknown) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalPlate(value));

export function parsePlateResult(data: { results?: PlateResult[] }) {
  const results = Array.isArray(data?.results) ? data.results : [];
  const best = results.filter(r => r && typeof r === "object")
    .filter(r => validPlate(r.plate))
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  if (!best) return { ...emptyVehicle, source: "plate-recognizer", message: "Nenhuma placa brasileira legível. Confira a foto ou preencha os dados manualmente." };
  const mmc = best.model_make?.[0];
  const color = textValue(best.color?.[0]?.color).toLowerCase();
  const type = textValue(best.vehicle?.type).toLowerCase();
  const category = typeof best.vehicle?.score === "number" && best.vehicle.score >= 0.25
    ? categoryPt[type] || "" : "";
  const score = best.score || 0;
  return {
    placa: normalPlate(best.plate),
    marca: titleCase(mmc?.make), modelo: titleCase(mmc?.model),
    cor: colorPt[color] || "", categoria: category,
    confianca: score >= 0.9 ? "alta" : score >= 0.7 ? "media" : "baixa",
    source: "plate-recognizer",
    message: "Confira a placa e o tipo do veículo antes de registrar a entrada.",
  };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export function createVehicleHandler({ authorize, apiKey, includeMMC = false, fetcher = fetch }: Dependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Use POST para enviar a foto." }, 405);
    try {
      const authStatus = await authorize(req);
      if (authStatus) return json({ error: authStatus === 401 ? "Entre no sistema para identificar veículos." : "Usuário sem acesso ativo." }, authStatus);
      let body;
      try { body = await req.json(); } catch { return json({ error: "Envie um JSON válido." }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Requisição inválida." }, 400);
      const { image, placa } = body;
      if (!image) {
        if (!validPlate(placa)) return json({ error: "Envie uma foto ou uma placa brasileira válida." }, 400);
        return json({ ...emptyVehicle, placa: normalPlate(placa), source: "none", message: "Veículo não encontrado no histórico. Preencha os dados ou envie uma foto." });
      }
      if (typeof image !== "string" || image.length > 11_300_000) return json({ error: "A imagem deve ter até 8 MB." }, 413);
      const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!match) return json({ error: "Envie uma foto JPEG, PNG ou WebP em base64." }, 400);
      let bytes;
      try { bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)); }
      catch { return json({ error: "Imagem base64 inválida." }, 400); }
      if (!bytes.length || bytes.length > 8 * 1024 * 1024) return json({ error: "A imagem deve ter até 8 MB." }, 413);
      if (!apiKey) return json({ error: "Leitura automática indisponível. Preencha a placa manualmente ou contate o administrador.", code: "RECOGNITION_NOT_CONFIGURED" }, 503);

      const form = new FormData();
      form.append("upload", new Blob([bytes], { type: match[1] }), "vehicle." + match[1].split("/")[1]);
      form.append("regions", "br");
      if (includeMMC) form.append("mmc", "true");
      let response;
      try {
        response = await fetcher("https://api.platerecognizer.com/v1/plate-reader/", {
          method: "POST", headers: { Authorization: "Token " + apiKey }, body: form,
          signal: AbortSignal.timeout(20_000),
        });
      } catch {
        return json({ error: "O serviço de leitura não respondeu. Tente novamente ou preencha manualmente." }, 502);
      }
      if (!response.ok) {
        const status = response.status === 429 ? 429 : 502;
        return json({ error: status === 429 ? "Limite de leitura atingido. Preencha manualmente ou tente mais tarde." : "Leitura automática indisponível. Confira a configuração do serviço com o administrador." }, status);
      }
      return json(parsePlateResult(await response.json()));
    } catch {
      return json({ error: "Não foi possível identificar o veículo. Preencha os dados manualmente." }, 500);
    }
  };
}
