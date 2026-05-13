import { describe, expect, it } from "vitest";

import { isUuid } from "./is-uuid";

describe("uuid/is-uuid.ts", () => {
	describe("#isUuid()", () => {
		it("returns true for valid UUID v4", () => {
			expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
		});

		it("returns true for valid UUID v1", () => {
			expect(isUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
		});

		it("returns false for invalid UUID", () => {
			expect(isUuid("not-a-uuid")).toBe(false);
		});

		it("returns false for UUID with wrong format", () => {
			expect(isUuid("550e8400e29b41d4a716446655440000")).toBe(false);
		});

		it("returns false for null", () => {
			expect(isUuid(null)).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(isUuid(undefined)).toBe(false);
		});

		it("returns false for number", () => {
			expect(isUuid(123)).toBe(false);
		});

		it("returns false for object", () => {
			expect(isUuid({})).toBe(false);
		});

		it("returns false for empty string", () => {
			expect(isUuid("")).toBe(false);
		});
	});
});
