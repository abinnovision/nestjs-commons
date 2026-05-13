import { describe, expect, it } from "vitest";

import { deepEqual } from "./deep-equal";

describe("equality/deep-equal.ts", () => {
	describe("#deepEqual()", () => {
		describe("primitives", () => {
			it("returns true for equal strings", () => {
				expect(deepEqual("foo", "foo")).toBe(true);
			});

			it("returns false for different strings", () => {
				expect(deepEqual("foo", "bar")).toBe(false);
			});

			it("treats NaN as equal to NaN", () => {
				expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
			});

			it("treats +0 and -0 as not equal", () => {
				expect(deepEqual(0, -0)).toBe(false);
			});

			it("does not coerce types", () => {
				expect(deepEqual(1, "1")).toBe(false);
			});
		});

		describe("plain objects", () => {
			it("returns true for structurally equal objects", () => {
				expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(
					true,
				);
			});

			it("returns false when an object has an extra key", () => {
				expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
			});

			it("distinguishes missing keys from explicit undefined", () => {
				expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
			});
		});

		describe("arrays", () => {
			it("returns true for arrays with equal contents", () => {
				expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
			});

			it("returns false when order differs", () => {
				expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
			});

			it("returns false when length differs", () => {
				expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
			});
		});

		describe("map and Set", () => {
			it("returns true for Maps with equal entries", () => {
				const left = new Map([
					["a", 1],
					["b", 2],
				]);
				const right = new Map([
					["b", 2],
					["a", 1],
				]);

				expect(deepEqual(left, right)).toBe(true);
			});

			it("returns true for Sets with equal members", () => {
				expect(deepEqual(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true);
			});
		});

		describe("date", () => {
			it("returns true for Date values with the same time", () => {
				expect(
					deepEqual(new Date("2024-01-01T00:00:00Z"), new Date(1704067200000)),
				).toBe(true);
			});

			it("returns false for Date values with different times", () => {
				expect(deepEqual(new Date("2024-01-01"), new Date("2024-01-02"))).toBe(
					false,
				);
			});
		});

		describe("different shapes", () => {
			it("returns false when comparing an array to a plain object", () => {
				expect(deepEqual([1, 2, 3], { 0: 1, 1: 2, 2: 3 })).toBe(false);
			});
		});
	});
});
