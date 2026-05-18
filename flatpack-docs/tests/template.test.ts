import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { emojiFaviconDataUri } from "../scripts-src/lib/template";

describe("emojiFaviconDataUri", () => {
  it("returns an SVG data URI", () => {
    expect(emojiFaviconDataUri("🐱")).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("embeds the chosen emoji in the encoded SVG", () => {
    const [, encoded] = emojiFaviconDataUri("🚀").split(",");
    const svg = Buffer.from(encoded ?? "", "base64").toString("utf8");

    expect(svg).toContain("<svg");
    expect(svg).toContain("🚀");
    expect(svg).toContain("</svg>");
  });
});
