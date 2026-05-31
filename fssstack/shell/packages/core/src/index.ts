export const shellName = "fss-shell";

export type HealthStatus = {
  ok: true;
  service: string;
};

export const createHealthStatus = (service: string): HealthStatus => ({
  ok: true,
  service,
});
