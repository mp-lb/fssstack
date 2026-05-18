import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { App, DemoCard } from "./App";
import { createTrpcClient, makeQueryClient, trpc } from "./trpc";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    QueryClientProvider: vi.fn(({ children }: { children: ReactNode }) => (
      <>{children}</>
    )),
  };
});

vi.mock("./trpc", () => ({
  createTrpcClient: vi.fn(() => ({ links: [] })),
  makeQueryClient: vi.fn(() => ({ defaultOptions: {} })),
  trpc: {
    Provider: vi.fn(({ children }: { children: ReactNode }) => <>{children}</>),
    helloWorld: {
      useQuery: vi.fn(),
    },
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the message from a tRPC React Query hook", () => {
    vi.mocked(trpc.helloWorld.useQuery).mockReturnValue({
      data: { message: "Hello world" },
      isError: false,
    } as never);

    render(<DemoCard />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(trpc.helloWorld.useQuery).toHaveBeenCalledTimes(1);
  });

  it("renders a loading state while the query is pending", () => {
    vi.mocked(trpc.helloWorld.useQuery).mockReturnValue({
      data: undefined,
      isError: false,
    } as never);

    render(<DemoCard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders an error state when the query fails", () => {
    vi.mocked(trpc.helloWorld.useQuery).mockReturnValue({
      data: undefined,
      isError: true,
    } as never);

    render(<DemoCard />);

    expect(screen.getByText("Unable to load message.")).toBeInTheDocument();
  });

  it("wraps the demo card with query and tRPC providers", () => {
    vi.mocked(trpc.helloWorld.useQuery).mockReturnValue({
      data: { message: "Hello world" },
      isError: false,
    } as never);

    render(<App />);

    expect(makeQueryClient).toHaveBeenCalledTimes(1);
    expect(createTrpcClient).toHaveBeenCalledTimes(1);
    expect(trpc.Provider).toHaveBeenCalledTimes(1);
  });
});
