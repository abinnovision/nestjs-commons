import { describe, expect, it } from "vitest";

import { isNullishOrEmptyString } from "./guards";

describe("string/guards.ts", () => {
	describe("#isNullishOrEmptyString()", () => {
		it("returns true for null", () => {
			expect(isNullishOrEmptyString(null)).toBe(true);
		});

		it("returns true for undefined", () => {
			expect(isNullishOrEmptyString(undefined)).toBe(true);
		});

		it("returns true for empty string", () => {
			expect(isNullishOrEmptyString("")).toBe(true);
		});

		it("returns false for non-empty string", () => {
			expect(isNullishOrEmptyString("hello")).toBe(false);
		});

		it("returns false for whitespace-only string", () => {
			expect(isNullishOrEmptyString("   ")).toBe(false);
		});

		it("returns false for number", () => {
			expect(isNullishOrEmptyString(0)).toBe(false);
		});

		it("returns false for boolean", () => {
			expect(isNullishOrEmptyString(false)).toBe(false);
		});

		it("returns false for object", () => {
			expect(isNullishOrEmptyString({})).toBe(false);
		});

		it("returns false for array", () => {
			expect(isNullishOrEmptyString([])).toBe(false);
		});
	});
});
