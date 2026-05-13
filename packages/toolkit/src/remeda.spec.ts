import { describe, expect, it } from "vitest";

import { R } from "./remeda";

describe("remeda.ts", () => {
	describe("r export", () => {
		it("exports remeda functions", () => {
			expect(typeof R.pipe).toBe("function");
			expect(typeof R.map).toBe("function");
			expect(typeof R.filter).toBe("function");
		});

		it("works with pipe", () => {
			const result = R.pipe(
				[1, 2, 3],
				R.map((x) => x * 2),
			);

			expect(result).toEqual([2, 4, 6]);
		});

		it("provides type guards", () => {
			expect(R.isString("hello")).toBe(true);
			expect(R.isString(123)).toBe(false);
		});

		it("provides array utilities", () => {
			expect(R.unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
		});
	});

	describe("toolkit-augmented utilities", () => {
		it("chains R.sanitizeString and R.slugify in a pipe", () => {
			expect(
				R.pipe("  <b>Hello World!</b>  ", R.sanitizeString(), R.slugify()),
			).toBe("hello-world");
		});

		it("exposes R.isUUID and R.isNullishOrEmptyString as guards", () => {
			expect(R.isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
			expect(R.isUUID("not-a-uuid")).toBe(false);

			expect(R.isNullishOrEmptyString("")).toBe(true);
			expect(R.isNullishOrEmptyString("hello")).toBe(false);
		});
	});
});
