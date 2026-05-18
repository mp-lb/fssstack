import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTrpcClient, makeQueryClient, trpc } from "./trpc";
import { Card, CardContent } from "./components/ui/card";

export const DemoCard = () => {
  const helloWorld = trpc.helloWorld.useQuery();

  const message = helloWorld.isError
    ? "Unable to load message."
    : (helloWorld.data?.message ?? "Loading...");

  return (
    <Card className="m-4">
      <CardContent className="space-y-4">
        <p>{message}</p>
      </CardContent>
    </Card>
  );
};

export const App = () => {
  const [queryClient] = useState(makeQueryClient);
  const [trpcClient] = useState(createTrpcClient);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DemoCard />
      </QueryClientProvider>
    </trpc.Provider>
  );
};
