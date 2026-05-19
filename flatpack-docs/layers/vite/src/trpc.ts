import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "__PACKAGE_PREFIX__-trpc";
import { env } from "./config";

export const trpc = createTRPCReact<AppRouter>();

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  });

export const createTrpcClient = () =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: `${env.API_BASE_URL}/trpc`,
        transformer: superjson,
      }),
    ],
  });
