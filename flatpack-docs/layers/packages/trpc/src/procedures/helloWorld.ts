import { message } from "__PACKAGE_PREFIX__-core";
import type { TRPCInstance } from "__PACKAGE_PREFIX__-server";
import { z } from "zod";

export const helloWorld = (t: TRPCInstance) =>
  t.procedure
    .input(z.object({ name: z.string().min(1).optional() }).optional())
    .query(({ input }) => {
      return {
        message: input?.name ? `Hello ${input.name}` : message,
      };
    });
