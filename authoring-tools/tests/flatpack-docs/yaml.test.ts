import { describe, expect, it } from "vitest";
import { jsonToYaml } from "../../scripts-src/flatpack-docs/lib/yaml";

describe("jsonToYaml", () => {
  it("serializes nested objects, arrays, and quoted strings", () => {
    expect(
      jsonToYaml({
        project: "demo",
        ports: ["BACKEND_PORT", "FRONTEND_PORT"],
        native: {
          backend: {
            cmd: "pnpm --filter=@demo/demo-backend dev",
            env: "*",
          },
        },
      }),
    ).toBe(
      [
        "project: 'demo'",
        "ports:",
        "  - 'BACKEND_PORT'",
        "  - 'FRONTEND_PORT'",
        "native:",
        "  backend:",
        "    cmd: 'pnpm --filter=@demo/demo-backend dev'",
        "    env: '*'",
        "",
      ].join("\n"),
    );
  });

  it("serializes multiline strings as literal blocks", () => {
    expect(
      jsonToYaml({
        cmds: [
          [
            "for app_or_package in {{REST}}; do",
            '  pnpm --dir "$app_or_package" run typecheck',
            "done",
          ].join("\n"),
        ],
      }),
    ).toBe(
      [
        "cmds:",
        "  - |",
        "    for app_or_package in {{REST}}; do",
        '      pnpm --dir "$app_or_package" run typecheck',
        "    done",
        "",
      ].join("\n"),
    );
  });
});
