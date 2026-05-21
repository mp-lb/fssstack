import { createServer } from "node:http";
import { healthJson, parsePort } from "@example/fss-shell-server";

const serviceName = "example-backend";

export const createExampleBackend = () =>
  createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(healthJson(serviceName));
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(`${JSON.stringify({ error: "not_found" })}\n`);
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parsePort(process.env.EXAMPLE_BACKEND_PORT, 3101);
  const server = createExampleBackend();

  server.listen(port, "0.0.0.0", () => {
    console.log(`${serviceName} listening on ${port}`);
  });
}
