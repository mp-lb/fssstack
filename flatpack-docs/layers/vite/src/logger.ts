import { env } from "./config";

type LogMeta = {
  id?: string;
  module?: string;
  message?: string;
  userId?: string;
  source?: {
    module?: string;
    platform?: string;
    env?: "development" | "staging" | "production";
    service?: string;
  };
};

type LogLevel = "info" | "warn" | "error" | "debug";

const createLogger = (baseMeta?: Partial<LogMeta>) => {
  const log = (
    level: LogLevel,
    eventType: string,
    details?: Record<string, unknown>,
    meta?: Partial<LogMeta>,
  ) => {
    const merged = {
      eventType,
      ...baseMeta,
      ...meta,
      details,
      timestamp: new Date().toISOString(),
    };

    const { message, ...rest } = merged;
    console[level](`[${eventType}]`, message ?? "", rest);
  };

  return {
    info: (
      eventType: string,
      details?: Record<string, unknown>,
      meta?: Partial<LogMeta>,
    ) => log("info", eventType, details, meta),
    warn: (
      eventType: string,
      details?: Record<string, unknown>,
      meta?: Partial<LogMeta>,
    ) => log("warn", eventType, details, meta),
    error: (
      eventType: string,
      details?: Record<string, unknown>,
      meta?: Partial<LogMeta>,
    ) => log("error", eventType, details, meta),
    debug: (
      eventType: string,
      details?: Record<string, unknown>,
      meta?: Partial<LogMeta>,
    ) => log("debug", eventType, details, meta),
    child: (childMeta: Partial<LogMeta>) =>
      createLogger({ ...baseMeta, ...childMeta }),
  };
};

export const logger = createLogger({
  source: {
    platform: "web",
    env: env.APP_ENV,
  },
});

window.addEventListener("error", (event) => {
  logger.error(
    "window.error",
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    },
    { message: event.message },
  );
});

window.addEventListener("unhandledrejection", (event) => {
  const err =
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

  logger.error(
    "window.unhandledRejection",
    { stack: err.stack, name: err.name },
    { message: err.message },
  );
});
