import { describe, expect, it } from "vitest";
import { exampleGreeting } from "./index.js";

describe("example library", () => {
  it("greets by name", () => {
    expect(exampleGreeting("Shell")).toBe(
      "Hello from the example library, Shell.",
    );
  });
});
