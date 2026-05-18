import { z } from "zod";

const envSchema = z
  .object({
    APP_ENV: z
      .enum(["development", "staging", "production"])
      .default("production"),
    __BACKEND_SERVICE_PORT_ENV__: z.string().transform(Number),
    FRONTEND_URL: z.string().optional(),
    FRONTEND_URLS: z.string().optional(),
  })
  .transform((env) => ({
    ...env,
    FRONTEND_URLS: (env.FRONTEND_URLS ?? env.FRONTEND_URL ?? "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean),
  }));

export const env = envSchema.parse(process.env);
export const isProd = env.APP_ENV === "production";
export const isDev = env.APP_ENV === "development";
