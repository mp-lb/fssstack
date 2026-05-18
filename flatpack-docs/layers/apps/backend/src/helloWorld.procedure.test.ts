import { describe, expect, it } from "vitest";
import { createTestTrpc } from "./test/createTestTrpc";

describe("helloWorld procedure", () => {
  it("returns the default greeting", async () => {
    const trpc = createTestTrpc();
    const caller = trpc.createCaller();

    await expect(caller.helloWorld()).resolves.toEqual({
      message: "Hello world",
    });
  });

  it("returns a personalized greeting", async () => {
    const trpc = createTestTrpc();
    const caller = trpc.createCaller();

    await expect(caller.helloWorld({ name: "Ada" })).resolves.toEqual({
      message: "Hello Ada",
    });
  });

  it("rejects invalid input", async () => {
    const trpc = createTestTrpc();
    const caller = trpc.createCaller();

    await expect(caller.helloWorld({ name: 123 } as never)).rejects.toThrow();
  });
});
