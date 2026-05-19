import { describe, expect, it } from "vitest";
import { packageName } from "./index";

describe("__PUBLISHABLE_PACKAGE_NAME__", () => {
  it("exports the package name", () => {
    expect(packageName).toBe("__PUBLISHABLE_PACKAGE_NAME__");
  });
});
