import { describe, expect, it } from "vitest";
import { healthJson, parsePort } from "./index.js";

describe("server helpers", () => {
  it("serializes health json", () => {
    expect(healthJson("example-backend")).toBe(
      '{"ok":true,"service":"example-backend"}\n',
    );
  });

  it("parses valid ports", () => {
    expect(parsePort("3101", 3000)).toBe(3101);
  });
});
