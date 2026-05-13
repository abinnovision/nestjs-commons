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
});
