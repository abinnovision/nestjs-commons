import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { configx } from "./configx.helpers";
import { resolveConfig } from "./configx.resolver";

describe("resolver.ts", () => {
	describe("#resolveConfig", () => {
		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("should resolve the env var mapping", () => {
			class Config extends configx({
				FOO_BAR: z.string(),
				FOO_BAR_NUMBER: z.number(),
			}) {}

			vi.stubEnv("FOO_BAR", "this is a string");
			vi.stubEnv("FOO_BAR_NUMBER", "123");

			const result = resolveConfig({
				config: Config,
			});

			expect(result).toEqual({
				FOO_BAR: "this is a string",
				FOO_BAR_NUMBER: 123,
			});
		});
	});
});
