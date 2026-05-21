import JSON5 from "json5";
import type { ProjectPromptConfig } from "./project-schema";

const manifestLine = (key: string, value: unknown, trailingComma = true) =>
  `  ${key}: ${JSON5.stringify(value)}${trailingComma ? "," : ""}`;

export const buildManifestJson5 = (config: ProjectPromptConfig) =>
  [
    "{",
    manifestLine("name", config.name),
    manifestLine("emoji", config.emoji),
    manifestLine("description", config.description),
    manifestLine("projectSlug", config.slug),
    manifestLine("packagePrefix", config.packagePrefix),
    manifestLine("shadcnPreset", config.shadcnPreset),
    manifestLine(
      "frontends",
      config.frontendClients.map((client) => ({
        name: client.slug,
        type: client.type,
      })),
    ),
    manifestLine("backends", config.backendServices),
    manifestLine("clis", config.cliPackages),
    manifestLine("libs", config.libraryPackages),
    manifestLine("extensions", config.extensions, false),
    "}",
  ].join("\n");
