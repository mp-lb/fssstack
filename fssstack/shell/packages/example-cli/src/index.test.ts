import { describe, expect, it } from "vitest";
import { runExampleCli } from "./index.js";

describe("example cli", () => {
  it("uses the provided name", () => {
    expect(runExampleCli(["Developer"])).toBe(
      "Hello from the example library, Developer.",
    );
  });
});
