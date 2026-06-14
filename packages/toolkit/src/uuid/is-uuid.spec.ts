import { describe, expect, it } from "vitest";

import { isUUID } from "./is-uuid.js";

describe("uuid/is-uuid.ts", () => {
	describe("#isUUID()", () => {
		it("returns true for valid UUID v4", () => {
			expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
		});

		it("returns true for valid UUID v1", () => {
			expect(isUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
		});

		it("returns false for invalid UUID", () => {
			expect(isUUID("not-a-uuid")).toBe(false);
		});

		it("returns false for UUID with wrong format", () => {
			expect(isUUID("550e8400e29b41d4a716446655440000")).toBe(false);
		});

		it("returns false for null", () => {
			expect(isUUID(null)).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(isUUID(undefined)).toBe(false);
		});

		it("returns false for number", () => {
			expect(isUUID(123)).toBe(false);
		});

		it("returns false for object", () => {
			expect(isUUID({})).toBe(false);
		});

		it("returns false for empty string", () => {
			expect(isUUID("")).toBe(false);
		});
	});
});
