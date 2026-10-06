import { expect, it } from "vitest";
import { validateRecoveryRedirect } from "./redirect";

const origin = "https://andersonestacionamento.online";
it("uses the intended recovery route", () => {
  expect(validateRecoveryRedirect(origin + "/reset-password", origin)).toBe(origin + "/reset-password");
});
it.each([
  "https://andersonestacionamento.online.evil.test/reset-password",
  "https://evil.test/reset-password",
  "http://andersonestacionamento.online/reset-password",
  origin + "/reset-password?next=https://evil.test",
  origin + "/login",
  "https://user:pass@andersonestacionamento.online/reset-password",
])("rejects unsafe recovery redirects: %s", url => {
  expect(validateRecoveryRedirect(url, origin)).toBeNull();
});
