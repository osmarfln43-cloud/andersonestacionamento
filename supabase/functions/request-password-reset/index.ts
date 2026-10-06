import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import { validateRecoveryRedirect } from "./redirect.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    let body;
    try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
    const { identifier, redirectTo } = body || {};
    const redirect = validateRecoveryRedirect(
      redirectTo,
      Deno.env.get("PASSWORD_RESET_ALLOWED_ORIGINS") || "https://andersonestacionamento.online",
    );
    if (typeof identifier !== "string" || !identifier.trim() || identifier.length > 320 || !redirect) {
      return json({ error: "Login/e-mail e link de retorno válidos são obrigatórios" }, 400);
    }
    const normalized = identifier.trim().toLowerCase();
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let query = supabaseAdmin.from("profiles").select("user_id, status");
    query = normalized.includes("@") ? query.eq("email", normalized) : query.eq("login", normalized.replace(/[^a-z0-9._-]/g, ""));
    const { data: profile, error: profileError } = await query.maybeSingle();
    if (profileError) throw new Error("Profile lookup failed");
    if (!profile?.user_id || profile.status !== "ativo") return json({ success: true });

    // An anonymous reset must never change/confirm Auth emails from editable profile data.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    if (authError) throw new Error("Auth lookup failed");
    const authEmail = authData.user?.email;
    if (!authEmail || authEmail.endsWith("@parking.local")) return json({ success: true });

    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { error: recoverError } = await authClient.auth.resetPasswordForEmail(authEmail, { redirectTo: redirect });
    if (recoverError) {
      // Do not expose account existence or provider details to anonymous callers.
      console.error("Password recovery delivery failed");
    }
    return json({ success: true });
  } catch {
    console.error("Password recovery failed");
    return json({ error: "Não foi possível enviar o link. Tente novamente mais tarde." }, 500);
  }
});
