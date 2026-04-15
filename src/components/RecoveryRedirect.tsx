import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Detects Supabase recovery parameters in the URL (hash or query) and
 * redirects to /reset-password so the user can set a new password.
 * 
 * Supabase recovery links can arrive as:
 * - Hash: /#access_token=...&type=recovery
 * - Query: /?code=...&type=recovery  
 * - Or land on any page with these params
 */
export function RecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Already on reset-password, skip
    if (location.pathname === "/reset-password") return;

    const hash = window.location.hash;
    const search = window.location.search;

    // Check hash fragment (older Supabase flow)
    if (hash && (hash.includes("type=recovery") || (hash.includes("access_token=") && hash.includes("recovery")))) {
      // Preserve the hash when redirecting
      navigate(`/reset-password${search}${hash}`, { replace: true });
      return;
    }

    // Check query params (PKCE flow)
    const params = new URLSearchParams(search);
    if (params.get("type") === "recovery" || (params.get("code") && params.get("type") === "recovery")) {
      navigate(`/reset-password${search}${hash}`, { replace: true });
      return;
    }
  }, [location.pathname, navigate]);

  return null;
}
