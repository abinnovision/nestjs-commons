import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { type } from "arktype";
import { configx } from "./create.js";
import { InvalidConfigError } from "./errors.js";

describe("create.ts", () => {
	describe("#configx", () => {
		afterEach(() => {
			vi.unstubAllEnvs();
		});

		describe("class creation", () => {
			it("should return a class constructor", () => {
				const schema = z.object({ PORT: z.string() });
				const ConfigClass = configx(schema);

				expect(typeof ConfigClass).toBe("function");
			});

			it("should expose the schema as a static property", () => {
				const schema = z.object({ PORT: z.string() });
				const ConfigClass = configx(schema);

				expect(ConfigClass.schema).toBe(schema);
			});
		});

		describe("instance creation with Zod", () => {
			it("should resolve config from process.env", () => {
				vi.stubEnv("PORT", "3000");
				const ConfigClass = configx(z.object({ PORT: z.string() }));

				const config = new ConfigClass();

				expect(config.PORT).toBe("3000");
			});

			it("should apply type transformations", () => {
				vi.stubEnv("PORT", "3000");
				const ConfigClass = configx(
					z.object({ PORT: z.string().transform(Number) }),
				);

				const config = new ConfigClass();

				expect(config.PORT).toBe(3000);
				expect(typeof config.PORT).toBe("number");
			});

			it("should apply default values when env var is missing", () => {
				const ConfigClass = configx(
					z.object({
						PORT: z.string().default("8080").transform(Number),
					}),
				);

				const config = new ConfigClass();

				expect(config.PORT).toBe(8080);
			});

			it("should handle multiple properties", () => {
				vi.stubEnv("PORT", "3000");
				vi.stubEnv("HOST", "localhost");
				const ConfigClass = configx(
					z.object({
						PORT: z.string().transform(Number),
						HOST: z.string(),
					}),
				);

				const config = new ConfigClass();

				expect(config.PORT).toBe(3000);
				expect(config.HOST).toBe("localhost");
			});
		});

		describe("instance creation with ArkType", () => {
			it("should resolve config from process.env", () => {
				vi.stubEnv("PORT", "3000");
				const ConfigClass = configx(type({ PORT: "string" }));

				const config = new ConfigClass();

				expect(config.PORT).toBe("3000");
			});

			it("should apply type transformations", () => {
				vi.stubEnv("PORT", "3000");
				const ConfigClass = configx(
					type({ PORT: type("string.numeric.parse") }),
				);

				const config = new ConfigClass();

				expect(config.PORT).toBe(3000);
				expect(typeof config.PORT).toBe("number");
			});

			it("should apply default values when env var is missing", () => {
				const ConfigClass = configx(
					type({
						PORT: "string.numeric.parse = '8080'",
					}),
				);

				const config = new ConfigClass();

				expect(config.PORT).toBe(8080);
			});
		});

		describe("error handling", () => {
			it("should throw InvalidConfigError when required env var is missing", () => {
				const ConfigClass = configx(z.object({ PORT: z.string() }));

				expect(() => new ConfigClass()).toThrow(InvalidConfigError);
			});

			it("should include the field name in the error message", () => {
				const ConfigClass = configx(z.object({ PORT: z.string() }));

				expect(() => new ConfigClass()).toThrow(/PORT/);
			});

			it("should throw InvalidConfigError for invalid value with Zod", () => {
				vi.stubEnv("PORT", "not-a-number");
				const ConfigClass = configx(
					z.object({
						PORT: z.string().transform(Number).pipe(z.number().int().positive()),
					}),
				);

				expect(() => new ConfigClass()).toThrow(InvalidConfigError);
			});

			it("should throw InvalidConfigError for invalid value with ArkType", () => {
				vi.stubEnv("PORT", "not-a-number");
				const ConfigClass = configx(
					type({ PORT: type("string.numeric.parse") }),
				);

				expect(() => new ConfigClass()).toThrow(InvalidConfigError);
			});
		});

		describe("typical usage pattern", () => {
			it("should work with class extension pattern", () => {
				vi.stubEnv("PORT", "3000");
				vi.stubEnv("HOST", "0.0.0.0");

				class AppConfigx extends configx(
					z.object({
						PORT: z.string().transform(Number),
						HOST: z.string().default("localhost"),
					}),
				) {}

				const config = new AppConfigx();

				expect(config.PORT).toBe(3000);
				expect(config.HOST).toBe("0.0.0.0");
				expect(AppConfigx.schema).toBeDefined();
			});
		});
	});
});
