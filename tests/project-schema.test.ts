import { describe, expect, it } from "vitest";
import {
  defaultProjectPromptConfig,
  normalizeProjectPromptConfig,
  projectPromptSchema,
} from "../app/project-schema";

describe("project prompt schema", () => {
  it("accepts CLI and library package lists", () => {
    const result = projectPromptSchema.safeParse({
      ...defaultProjectPromptConfig,
      description: "Example project.",
      cliPackages: ["toolbox"],
      libraryPackages: ["sdk"],
    });

    expect(result.success).toBe(true);
  });

  it("requires app and package slugs to be unique", () => {
    const result = projectPromptSchema.safeParse({
      ...defaultProjectPromptConfig,
      description: "Example project.",
      cliPackages: ["backend"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "App and package slugs must be unique.",
      );
    }
  });

  it("normalizes CLI and library package slugs", () => {
    expect(
      normalizeProjectPromptConfig({
        ...defaultProjectPromptConfig,
        cliPackages: ["Tool Box"],
        libraryPackages: ["SDK"],
      }),
    ).toMatchObject({
      cliPackages: ["tool-box"],
      libraryPackages: ["sdk"],
    });
  });
});
