import { describe, it, expect } from "vitest";
import app from "../src/index.js";

describe("Skill Marketplace Backend", () => {
  it("GET /skills returns the full extensions catalog", async () => {
    const res = await app.request("/skills");
    expect(res.status).toBe(200);
    const data = await res.json() as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(4);
    expect(data[0].id).toBe("skill_slack");
  });

  it("POST /skills/install completes successfully for valid skillId", async () => {
    const res = await app.request("/skills/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: "skill_slack" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.skillId).toBe("skill_slack");
  });

  it("POST /skills/install returns 400 for unsafe skillId failing sandbox check", async () => {
    const res = await app.request("/skills/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: "skill_exploit_leak" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toBe("Sandbox safety review failed");
    expect(data.errors.length).toBeGreaterThan(0);
  });

  it("POST /skills/install returns 404 for unknown skillId", async () => {
    const res = await app.request("/skills/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: "skill_unknown" }),
    });
    expect(res.status).toBe(404);
  });

  it("POST /skills/install returns 400 for missing skillId", async () => {
    const res = await app.request("/skills/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
