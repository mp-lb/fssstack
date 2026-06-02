import { describe, expect, it } from "vitest";
import { runExampleCli } from ".";

describe("example cli", () => {
  it("uses the provided name", () => {
    expect(runExampleCli(["Developer"])).toBe("Hello, Developer.");
  });

  it("falls back to a default name", () => {
    expect(runExampleCli([])).toBe("Hello, world.");
  });
});
