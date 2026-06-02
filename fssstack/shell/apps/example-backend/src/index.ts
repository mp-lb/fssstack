import { createServer } from "node:http";
import {
  createCallerFactory,
  createContext,
  logger,
} from "@example/fss-shell-server";
import { appRouter } from "@example/fss-shell-trpc";

const serviceName = "example-backend";
const createCaller = createCallerFactory(appRouter);

export const createExampleBackend = () =>
  createServer((request, response) => {
    if (request.url !== "/health") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(`${JSON.stringify({ error: "not_found" })}\n`);

      return;
    }

    const caller = createCaller(createContext());

    caller
      .greet({ name: serviceName })
      .then((greeting) => {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(`${JSON.stringify({ ok: true, ...greeting })}\n`);
      })
      .catch(() => {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(`${JSON.stringify({ error: "internal" })}\n`);
      });
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.EXAMPLE_BACKEND_PORT ?? 3101);
  const server = createExampleBackend();

  server.listen(port, "0.0.0.0", () => {
    logger.info(
      "backend.listening",
      { port },
      { source: { service: serviceName } },
    );
  });
}
