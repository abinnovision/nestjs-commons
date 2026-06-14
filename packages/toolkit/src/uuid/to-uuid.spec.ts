import { describe, expect, it } from "vitest";

import { toUUID } from "./to-uuid.js";

describe("uuid/to-uuid.ts", () => {
	describe("#toUUID()", () => {
		it("returns the value branded as UUID for a valid v4 string", () => {
			const raw = "550e8400-e29b-41d4-a716-446655440000";

			expect(toUUID(raw)).toBe(raw);
		});

		it("accepts other valid UUID versions", () => {
			const raw = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

			expect(toUUID(raw)).toBe(raw);
		});

		it("throws TypeError for an invalid UUID string", () => {
			expect(() => toUUID("not-a-uuid")).toThrow(TypeError);
		});

		it("throws TypeError for a string without hyphens", () => {
			expect(() => toUUID("550e8400e29b41d4a716446655440000")).toThrow(
				TypeError,
			);
		});

		it("throws TypeError for an empty string", () => {
			expect(() => toUUID("")).toThrow(TypeError);
		});

		it("includes the invalid value in the error message", () => {
			expect(() => toUUID("nope")).toThrow(/nope/);
		});
	});
});
