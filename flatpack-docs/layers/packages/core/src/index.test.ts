import { describe, expect, it } from "vitest";

import { message } from "./index";

describe("core package", () => {
  it("exports the starter message", () => {
    expect(message).toBe("Hello world");
  });
});
