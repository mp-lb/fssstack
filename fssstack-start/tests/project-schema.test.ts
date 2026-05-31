import { describe, expect, it } from "vitest";
import {
  defaultProjectPromptConfig,
  normalizeProjectPromptConfig,
  projectPromptSchema,
} from "../app/project-schema";

describe("project prompt schema", () => {
  it("accepts library package lists", () => {
    const result = projectPromptSchema.safeParse({
      ...defaultProjectPromptConfig,
      description: "Example project.",
      libraryPackages: ["sdk"],
      extensions: ["mongodb", "s3"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown extensions", () => {
    const result = projectPromptSchema.safeParse({
      ...defaultProjectPromptConfig,
      description: "Example project.",
      extensions: ["unknown"],
    });

    expect(result.success).toBe(false);
  });

  it("requires app and package slugs to be unique", () => {
    const result = projectPromptSchema.safeParse({
      ...defaultProjectPromptConfig,
      description: "Example project.",
      libraryPackages: ["backend"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "App and package slugs must be unique.",
      );
    }
  });

  it("normalizes library package slugs", () => {
    expect(
      normalizeProjectPromptConfig({
        ...defaultProjectPromptConfig,
        libraryPackages: ["Tool Box", "SDK"],
      }),
    ).toMatchObject({
      libraryPackages: ["tool-box", "sdk"],
    });
  });
});
