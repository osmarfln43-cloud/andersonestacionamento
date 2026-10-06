export const TARGET_PROJECT_ID = "zjzqtrhctilnyzqoorys";

// Prevent a preview/production build from silently using the old backend.
// This checks configuration only; it does not prove the key is valid remotely.
export function validateSupabaseEnvironment(env) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (url !== `https://${TARGET_PROJECT_ID}.supabase.co`) {
    throw new Error(`VITE_SUPABASE_URL deve apontar para o destino ${TARGET_PROJECT_ID}. Configure o ambiente antes de publicar.`);
  }
  if (env.VITE_SUPABASE_PROJECT_ID && env.VITE_SUPABASE_PROJECT_ID !== TARGET_PROJECT_ID) {
    throw new Error("VITE_SUPABASE_PROJECT_ID não corresponde ao projeto de destino.");
  }
  if (!key || key.startsWith("COLE_")) {
    throw new Error("Configure VITE_SUPABASE_PUBLISHABLE_KEY com a chave pública do Supabase de destino.");
  }
  if (key.startsWith("sb_publishable_") && key.length > 20) return;
  let claims;
  try {
    const parts = key.split(".");
    if (parts.length !== 3) throw new Error();
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("Use uma chave pública publishable ou anon. Chaves secretas não podem entrar no frontend.");
  }
  if (claims.role !== "anon" || claims.ref !== TARGET_PROJECT_ID) {
    throw new Error("A chave anon deve pertencer ao destino. service_role e chaves do projeto antigo são proibidas no frontend.");
  }
}
