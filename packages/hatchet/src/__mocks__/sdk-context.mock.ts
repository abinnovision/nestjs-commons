import { mockDeep } from "vitest-mock-extended";

import type { Context } from "@hatchet-dev/typescript-sdk";

/**
 * Creates a mock SDK Context for testing.
 */
export const createMockSdkContext = <I>(input?: I) => {
	const mock = mockDeep<Context<I, any>>();

	// Use Object.defineProperty to bypass type restriction on deep mock
	Object.defineProperty(mock, "input", { value: input, writable: true });

	return mock;
};
