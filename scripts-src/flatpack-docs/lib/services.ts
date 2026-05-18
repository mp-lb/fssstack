import { fail } from "./args";

const serviceNamePattern = /^[a-z][a-z0-9-]*$/;

export const parseServiceList = (raw: string): string[] =>
  raw
    .replaceAll(/\([^)]*\)/g, "")
    .replaceAll(",", " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

export const validateServiceName = (serviceName: string): void => {
  if (!serviceNamePattern.test(serviceName)) {
    fail(
      `invalid service name '${serviceName}'; use lowercase letters, numbers, and hyphens`,
    );
  }
};

export const assertUniqueServices = (
  serviceNames: string[],
  label = "service",
): void => {
  const seen = new Set<string>();

  for (const serviceName of serviceNames) {
    validateServiceName(serviceName);

    if (seen.has(serviceName)) {
      fail(`duplicate ${label} name '${serviceName}'`);
    }

    seen.add(serviceName);
  }
};

export const portEnvName = (serviceName: string): string =>
  `${serviceName.toUpperCase().replaceAll("-", "_")}_PORT`;
