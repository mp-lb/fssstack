import JSON5 from "json5";
import type { ProjectPromptConfig } from "./project-schema";

const manifestLine = (key: string, value: unknown, trailingComma = true) =>
  `  ${key}: ${JSON5.stringify(value)}${trailingComma ? "," : ""}`;

export const buildManifestJson5 = (config: ProjectPromptConfig) =>
  [
    "{",
    manifestLine("projectSlug", config.slug),
    manifestLine(
      "frontends",
      config.frontendClients.map((client) => client.slug),
    ),
    manifestLine("backends", config.backendServices),
    manifestLine("clis", config.cliPackages),
    manifestLine("libs", config.libraryPackages),
    manifestLine("extensions", [], false),
    "}",
  ].join("\n");
