import { describe, expect, it } from "vitest";

import { createLogger, handleTrpcError, logger, t } from "./index";

describe("server package", () => {
  it("exports server infrastructure", () => {
    expect(createLogger).toBeDefined();
    expect(handleTrpcError).toBeDefined();
    expect(logger).toBeDefined();
    expect(t).toBeDefined();
  });
});
