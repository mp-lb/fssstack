import { fail, getScriptArgs } from "./lib/args";
import { patchViteLayer } from "./lib/vite";

const args = getScriptArgs();
const targetRoot = args[0];
const frontendClient = process.env.FRONTEND_CLIENT;
const clientPortEnv = process.env.CLIENT_PORT_ENV;

if (!targetRoot || !frontendClient || !clientPortEnv) {
  fail(
    "usage: FRONTEND_CLIENT=<name> CLIENT_PORT_ENV=<ENV> patch-vite-layer.mjs /path/to/target-project",
  );
}

const resolvedTargetRoot = targetRoot;
const resolvedFrontendClient = frontendClient as string;
const resolvedClientPortEnv = clientPortEnv as string;

patchViteLayer(
  resolvedTargetRoot,
  resolvedFrontendClient,
  resolvedClientPortEnv,
);
