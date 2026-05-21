import { describe, expect, it } from "vitest";
import {
  parseServiceList,
  portEnvName,
} from "../../scripts-src/flatpack-docs/lib/services";

describe("service helpers", () => {
  it("parses comma-separated services and strips type annotations", () => {
    expect(
      parseServiceList("frontend (react-vite), foobar (react-vite)"),
    ).toEqual(["frontend", "foobar"]);
  });

  it("accepts whitespace-separated services", () => {
    expect(parseServiceList("backend baz")).toEqual(["backend", "baz"]);
  });

  it("accepts comma-separated services without spaces", () => {
    expect(parseServiceList("backend,baz")).toEqual(["backend", "baz"]);
  });

  it("accepts mixed commas and whitespace", () => {
    expect(parseServiceList("backend, baz api")).toEqual([
      "backend",
      "baz",
      "api",
    ]);
  });

  it("derives zap port env names", () => {
    expect(portEnvName("frontend")).toBe("FRONTEND_PORT");
    expect(portEnvName("admin-panel")).toBe("ADMIN_PANEL_PORT");
  });
});
