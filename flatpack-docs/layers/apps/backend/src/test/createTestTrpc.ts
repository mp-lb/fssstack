import { createLogger, t, type AppContext } from "__PACKAGE_PREFIX__-server";
import { createTrpcRouter, type AppRouter } from "__PACKAGE_PREFIX__-trpc";

type TestCaller = ReturnType<AppRouter["createCaller"]>;

type CreateTestTrpcOptions = {
  context?: Partial<AppContext>;
};

export const createTestTrpc = (
  options: CreateTestTrpcOptions = {},
): {
  createCaller: (context?: Partial<AppContext>) => TestCaller;
} => {
  const appRouter = createTrpcRouter(t);

  const baseContext: AppContext = {
    logger: createLogger(
      {
        source: {
          service: "backend-test",
          env: "development",
        },
      },
      { level: "silent" },
    ),
    ...options.context,
  };

  return {
    createCaller: (context = {}) =>
      appRouter.createCaller({
        ...baseContext,
        ...context,
      }),
  };
};
