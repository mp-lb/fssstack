import type { TRPCInstance } from "__PACKAGE_PREFIX__-server";
import { helloWorld } from "./procedures/helloWorld";

export const createTrpcRouter = (t: TRPCInstance) =>
  t.router({
    helloWorld: helloWorld(t),
  });

export type AppRouter = ReturnType<typeof createTrpcRouter>;
