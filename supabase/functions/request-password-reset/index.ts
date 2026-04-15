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

    // Find the profile
    let profileQuery = supabaseAdmin
      .from("profiles")
      .select("user_id, email, login, status");

    profileQuery = isEmail
      ? profileQuery.eq("email", normalizedIdentifier)
      : profileQuery.eq("login", normalizeLogin(normalizedIdentifier));

    const { data: profile } = await profileQuery.maybeSingle();

    // Always return success (don't leak whether user exists)
    if (!profile?.user_id || !profile?.email) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure the auth user email matches the profile real email
    await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
      email: profile.email,
      email_confirm: true,
    });

    // Generate a magic link of type recovery using admin API
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: profile.email,
        options: {
          redirectTo,
        },
      });

    if (linkError) {
      console.error("generateLink error:", linkError);
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar o link de recuperação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The generated link contains a token-hash + type params pointing to the
    // Supabase auth confirm endpoint. We need to build a link that the user
    // clicks and lands on OUR app's /reset-password page.
    // 
    // The admin generateLink returns properties.hashed_token and
    // properties.verification_type.  We'll construct a link that goes through
    // the Supabase /auth/v1/verify endpoint which then redirects to our app.
    const token = linkData?.properties?.hashed_token;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Build the verification URL that Supabase will redirect from
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`;

    // Send a simple recovery email using the Supabase Auth REST API
    // We'll use the admin API to send a custom email via the /auth/v1/admin/generate_link
    // But actually, we already have the link. Let's send the email ourselves.
    
    // Use Supabase's built-in email by calling the recover endpoint
    // but this time with the admin API which is more reliable
    const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      },
      body: JSON.stringify({
        email: profile.email,
        gotrue_meta_security: { captcha_token: "" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("recover error:", errText);
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
