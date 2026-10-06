import { describe, expect, it, vi } from "vitest";
import { createVehicleHandler, parsePlateResult } from "./handler";

const photo = "data:image/jpeg;base64,/9j/2Q==";
const post = (body: unknown) => new Request("https://example.test/identify", { method: "POST", body: JSON.stringify(body) });
const allow = async () => null;

describe("recognition independent of Lovable", () => {
  it.each([401, 403] as const)("rejects unauthorized callers before any paid request (%s)", async status => {
    const fetcher = vi.fn();
    const handler = createVehicleHandler({ authorize: async () => status, apiKey: "test", fetcher });
    expect((await handler(post({ image: photo }))).status).toBe(status);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not call a provider or infer details from a typed plate", async () => {
    const fetcher = vi.fn();
    const response = await createVehicleHandler({ authorize: allow, fetcher })(post({ placa: "abc-1234" }));
    expect(await response.json()).toMatchObject({ placa: "ABC1234", marca: "", modelo: "", categoria: "", source: "none" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("reports a missing key without breaking the manual entry path", async () => {
    const response = await createVehicleHandler({ authorize: allow })(post({ image: photo }));
    expect(response.status).toBe(503);
    expect(await response.json()).toHaveProperty("code", "RECOGNITION_NOT_CONFIGURED");
  });
  it.each(["https://example.test/photo.jpg", "data:text/html;base64,YQ==", "data:image/jpeg;base64,%!"])("rejects unsupported images", async image => {
    const fetcher = vi.fn();
    const response = await createVehicleHandler({ authorize: allow, apiKey: "test", fetcher })(post({ image }));
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sends only to Plate Recognizer and preserves motorcycle recognition", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ results: [
      { plate: "abc1d23", score: 0.98, vehicle: { type: "Motorcycle", score: 0.95 } },
    ] }));
    const response = await createVehicleHandler({ authorize: allow, apiKey: "test", fetcher })(post({ image: photo }));
    expect(await response.json()).toMatchObject({ placa: "ABC1D23", categoria: "moto", marca: "", cor: "", source: "plate-recognizer" });
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.platerecognizer.com/v1/plate-reader/");
    expect(request.body.get("regions")).toBe("br");
    expect(request.body.has("mmc")).toBe(false);
  });
  it("enables optional make/model/color only when configured", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ results: [] }));
    await createVehicleHandler({ authorize: allow, apiKey: "test", includeMMC: true, fetcher })(post({ image: photo }));
    expect(fetcher.mock.calls[0][1].body.get("mmc")).toBe("true");
  });
  it("never invents a category or truncates invalid plates", () => {
    expect(parsePlateResult({ results: [{ plate: "ABC1D234", score: 1 }] }).placa).toBe("");
    expect(parsePlateResult({ results: [{ plate: "ABC1D23", vehicle: { type: "Car", score: 0.1 } }] }).categoria).toBe("");
  });
  it("returns a usable manual fallback when no plate is found", () => {
    expect(parsePlateResult({ results: [] })).toMatchObject({ placa: "", categoria: "", source: "plate-recognizer" });
  });
  it("reports rate limiting without exposing credentials or provider payload", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("private provider detail", { status: 429 }));
    const response = await createVehicleHandler({ authorize: allow, apiKey: "private-key", fetcher })(post({ image: photo }));
    expect(response.status).toBe(429);
    expect(await response.text()).not.toMatch(/private/);
  });
});
