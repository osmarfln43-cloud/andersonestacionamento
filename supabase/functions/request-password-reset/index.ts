import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const normalizeLogin = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { identifier, redirectTo } = await req.json();

    if (!identifier || !redirectTo) {
      return new Response(JSON.stringify({ error: "Login/e-mail e link de retorno são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const isEmail = normalizedIdentifier.includes("@");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let profileQuery = supabaseAdmin
      .from("profiles")
      .select("user_id, email, login, status");

    profileQuery = isEmail
      ? profileQuery.eq("email", normalizedIdentifier)
      : profileQuery.eq("login", normalizeLogin(normalizedIdentifier));

    const { data: profile } = await profileQuery.maybeSingle();

    if (!profile?.user_id || !profile?.email) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
      email: profile.email,
      email_confirm: true,
    });

    const recoverResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")!}`,
      },
      body: JSON.stringify({
        email: profile.email,
        redirect_to: redirectTo,
      }),
    });

    if (!recoverResponse.ok) {
      const errorText = await recoverResponse.text();
      return new Response(JSON.stringify({ error: errorText || "Não foi possível enviar o link" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
