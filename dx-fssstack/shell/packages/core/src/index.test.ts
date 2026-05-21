import { describe, expect, it } from "vitest";
import { createHealthStatus, shellName } from "./index.js";

describe("core", () => {
  it("creates health status", () => {
    expect(createHealthStatus("example-backend")).toEqual({
      ok: true,
      service: "example-backend",
    });
  });

  it("exports the shell name", () => {
    expect(shellName).toBe("fss-shell");
  });
});
