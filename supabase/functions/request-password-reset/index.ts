import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const normalizeLogin = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { identifier, redirectTo } = await req.json();

    if (!identifier || !redirectTo) {
      return new Response(
        JSON.stringify({ error: "Login/e-mail e link de retorno são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Ensure auth email matches profile
    await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
      email: profile.email,
      email_confirm: true,
    });

    // Use the recover endpoint with SERVICE_ROLE key (bypasses redirect restrictions)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email: profile.email,
      }),
    });

    const responseText = await response.text();
    console.log("recover response:", response.status, responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Não foi possível enviar o link" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("request-password-reset error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
