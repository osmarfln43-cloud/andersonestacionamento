import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import { createVehicleHandler } from "./handler.ts";

Deno.serve(createVehicleHandler({
  apiKey: Deno.env.get("PLATE_RECOGNIZER_API_KEY"),
  // MMC requires the corresponding provider plan; plate reading works without it.
  includeMMC: Deno.env.get("PLATE_RECOGNIZER_MMC") === "true",
  authorize: async (req) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return 401;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
    if (error || !user) return 401;
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("status").eq("user_id", user.id).maybeSingle();
    if (profileError || profile?.status !== "ativo") return 403;
    return null;
  },
}));
