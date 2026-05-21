import type { HealthStatus } from "@example/fss-shell-core";

export type ExampleApi = {
  health: () => HealthStatus;
};

export const apiPackageName = "@example/fss-shell-trpc";
