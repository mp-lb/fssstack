import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { t } from "__PACKAGE_PREFIX__-server";
import { z } from "zod";
import { createTrpcRouter } from "__PACKAGE_PREFIX__-trpc";

const appRouter = createTrpcRouter(t);

describe("__BACKEND_SERVICE_NAME__", () => {
  it("should respond to health check", async () => {
    const app = Fastify();

    await app.register(cors, {
      origin: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });

    await app.register(fastifyTRPCPlugin, {
      prefix: "/trpc",
      trpcOptions: { router: appRouter },
    });

    app.get("/health", (_, reply) => reply.status(200).send({ ok: true }));

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await app.close();
  });

  it("should return bad request for zod input errors without crashing", async () => {
    const app = Fastify();

    const router = t.router({
      parseNumber: t.procedure
        .input(z.object({ value: z.number() }))
        .mutation(({ input }) => ({ ok: input.value })),
    });

    await app.register(fastifyTRPCPlugin, {
      prefix: "/trpc",
      trpcOptions: { router },
    });

    app.get("/health", (_, reply) => reply.status(200).send({ ok: true }));

    const trpcResponse = await app.inject({
      method: "POST",
      url: "/trpc/parseNumber",
      payload: {
        json: {
          value: "not-a-number",
        },
      },
    });

    expect(trpcResponse.statusCode).toBe(400);
    expect(trpcResponse.body).toContain("BAD_REQUEST");

    const healthResponse = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(healthResponse.statusCode).toBe(200);
    expect(healthResponse.json()).toEqual({ ok: true });

    await app.close();
  });
});
