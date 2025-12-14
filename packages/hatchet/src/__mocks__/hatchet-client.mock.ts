import { mockDeep } from "vitest-mock-extended";

import type { HatchetClient } from "@hatchet-dev/typescript-sdk";

/**
 * Creates a mock HatchetClient for testing.
 */
export const createMockHatchetClient = () => mockDeep<HatchetClient>();
