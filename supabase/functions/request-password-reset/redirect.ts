export function validateRecoveryRedirect(value: unknown, allowedOrigins: string): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const allowed = allowedOrigins.split(",").map(v => v.trim()).filter(Boolean);
    if (url.protocol !== "https:" || !allowed.includes(url.origin)) return null;
    if (url.username || url.password || url.pathname !== "/reset-password" || url.search || url.hash) return null;
    return url.href;
  } catch {
    return null;
  }
}
