type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const scalarToYaml = (value: null | boolean | number | string): string => {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  return `'${value.replaceAll("'", "''")}'`;
};

const valueToYaml = (value: JsonValue, indent: number): string[] => {
  const pad = " ".repeat(indent);

  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    if (typeof value === "string" && value.includes("\n")) {
      return [
        "|",
        ...value.split("\n").map((line) => `${" ".repeat(indent)}${line}`),
      ];
    }

    return [scalarToYaml(value)];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return ["[]"];

    return value.flatMap((item) => {
      const rendered = valueToYaml(item, indent + 2);
      const [firstLine = "", ...rest] = rendered;

      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        return [`${pad}- ${firstLine}`, ...rest];
      }

      return [`${pad}- ${firstLine}`, ...rest];
    });
  }

  return objectToYaml(value, indent);
};

const objectToYaml = (
  value: { [key: string]: JsonValue },
  indent: number,
): string[] => {
  const lines: string[] = [];
  const pad = " ".repeat(indent);

  for (const [key, item] of Object.entries(value)) {
    const rendered = valueToYaml(item, indent + 2);

    if (
      rendered.length === 1 &&
      (item === null ||
        typeof item === "boolean" ||
        typeof item === "number" ||
        typeof item === "string")
    ) {
      lines.push(`${pad}${key}: ${rendered[0]}`);
      continue;
    }

    lines.push(`${pad}${key}:`);
    lines.push(...rendered);
  }

  return lines;
};

export const jsonToYaml = (value: { [key: string]: JsonValue }): string =>
  `${objectToYaml(value, 0).join("\n")}\n`;
