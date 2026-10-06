import { expect, it } from "vitest";
import { validateSupabaseEnvironment, TARGET_PROJECT_ID } from "./validate-supabase-env.mjs";

const config = { VITE_SUPABASE_URL: "https://" + TARGET_PROJECT_ID + ".supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_offline_test_only" };
const jwt = (claims: object) => "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".test";
it("accepts destination public key formats", () => {
  expect(() => validateSupabaseEnvironment(config)).not.toThrow();
  expect(() => validateSupabaseEnvironment({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY: jwt({ role: "anon", ref: TARGET_PROJECT_ID }) })).not.toThrow();
});
it("blocks the source backend and mismatched legacy keys", () => {
  expect(() => validateSupabaseEnvironment({ ...config, VITE_SUPABASE_URL: "https://fllkpiwmckppzvhrjlia.supabase.co" })).toThrow();
  expect(() => validateSupabaseEnvironment({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY: jwt({ role: "anon", ref: "fllkpiwmckppzvhrjlia" }) })).toThrow();
});
it.each(["", "COLE_A_CHAVE", "sb_secret_private_test", jwt({ role: "service_role", ref: TARGET_PROJECT_ID })])("blocks missing/secret credentials", key => {
  expect(() => validateSupabaseEnvironment({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY: key })).toThrow();
});
