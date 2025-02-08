/* eslint-disable max-nested-callbacks */
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ConfigxError } from "./configx.errors.js";
import { configx } from "./configx.helpers.js";
import { resolveConfig } from "./configx.resolver.js";

import type { ConfigxSchema } from "./configx.types.js";
import { type } from "arktype";

type TestCase = [
	schema: ConfigxSchema,
	env: Record<string, string | undefined>,
	expected: any | "rejects",
];

const testMatrix: TestCase[] = [
	// - zod

	// Simple string type.
	[z.object({ PORT: z.string() }), { PORT: "123" }, { PORT: "123" }],

	// Transforming the string into number.
	[
		z.object({ PORT: z.string().transform(Number) }),
		{ PORT: "123" },
		{ PORT: 123 },
	],

	// Transforming the string into number with default.
	[
		z.object({
			PORT: z.string().default("3000").transform(Number).pipe(z.number()),
		}),
		{},
		{ PORT: 3000 },
	],

	// Advanced transformation.
	[
		z.object({
			CORS_ALLOWED_ORIGINS: z
				.string()
				.transform((it) => it.split(","))
				.pipe(z.string().array().default(["*"])),
		}),
		{ CORS_ALLOWED_ORIGINS: "http://localhost:3000" },
		{ CORS_ALLOWED_ORIGINS: ["http://localhost:3000"] },
	],

	// Simple discriminated union.
	[
		z.discriminatedUnion("TYPE", [
			z.object({ TYPE: z.literal("foo") }),
			z.object({ TYPE: z.literal("bar") }),
		]),
		{ TYPE: "foo" },
		{ TYPE: "foo" },
	],

	// Discriminated union with additional properties per option.
	[
		z.discriminatedUnion("TYPE", [
			z.object({ TYPE: z.literal("foo"), FOO: z.string() }),
			z.object({ TYPE: z.literal("bar"), BAR: z.string() }),
		]),
		{ TYPE: "foo", FOO: "foo" },
		{ TYPE: "foo", FOO: "foo" },
	],

	// Discriminated union with additional properties per option which rejects.
	[
		z.discriminatedUnion("TYPE", [
			z.object({ TYPE: z.literal("foo"), FOO: z.string() }),
			z.object({ TYPE: z.literal("bar"), BAR: z.string() }),
		]),
		{ TYPE: "foo" },
		"rejects",
	],

	// Standard union.
	[
		z.union([
			z.object({ TYPE: z.literal("foo") }),
			z.object({ TYPE: z.literal("bar") }),
		]),
		{ TYPE: "foo" },
		{ TYPE: "foo" },
	],

	[
		z.intersection(
			z.object({ PORT: z.string() }),
			z.discriminatedUnion("TYPE", [
				z.object({ TYPE: z.literal("foo"), FOO: z.string() }),
				z.object({ TYPE: z.literal("bar"), BAR: z.string() }),
			]),
		),
		{ PORT: "123", TYPE: "foo", FOO: "bar" },
		{ PORT: "123", TYPE: "foo", FOO: "bar" },
	],

	// - arktype

	// Simple string type.
	[type({ PORT: "string" }), { PORT: "123" }, { PORT: "123" }],

	// Transforming the string into number.
	[
		type({ PORT: type("string.numeric.parse") }),
		{ PORT: "123" },
		{ PORT: 123 },
	],

	// With default
	[
		type({
			PORT: "string.numeric.parse = '3000'",
			HOST: "string = '127.0.0.1'",
		}),
		{},
		{ PORT: 3000, HOST: "127.0.0.1" },
	],

	// Discriminated union.
	[
		type({ TYPE: "'foo'", FOO: "string" }).or(type({ TYPE: "'bar'" })),
		{ TYPE: "foo", FOO: "foo" },
		{ TYPE: "foo", FOO: "foo" },
	],
];

describe("resolver.ts", () => {
	describe("#resolveConfig", () => {
		testMatrix.forEach(([schema, env, expected], idx) => {
			it(`should resolve the test case #${idx}`, async () => {
				class Config extends configx(schema) {}

				if (expected === "rejects") {
					// This will throw an error.
					await expect(
						resolveConfig({
							config: Config,
							resolveEnv: () => env,
						}),
					).rejects.toThrow(ConfigxError);
				} else {
					await expect(
						resolveConfig({
							config: Config,
							resolveEnv: () => env,
						}),
					).resolves.toEqual(expected);
				}
			});
		});
	});
});
