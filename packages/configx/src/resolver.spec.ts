import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ConfigxConfig } from "./configx-config";
import { resolveConfig } from "./resolver";

describe("resolver.ts", () => {
	describe("#resolveConfig", () => {
		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("should resolve the env var mapping", () => {
			const config = new ConfigxConfig({
				schema: z.object({
					fooBar: z.string(),
					fooBarNumber: z.coerce.number(),
				}),
			});

			vi.stubEnv("FOO_BAR", "this is a string");
			vi.stubEnv("FOO_BAR_NUMBER", "123");

			const result = resolveConfig({
				config,
				sharedOptions: {},
			});

			expect(result).toEqual({
				fooBar: "this is a string",
				fooBarNumber: 123,
			});
		});
	});
});
