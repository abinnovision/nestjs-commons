import { describe, expect, it } from "vitest";

import { AppException } from "./app-exception";
import { MultiAppException } from "./multi-app-exception";

class TestException extends AppException {
	public code = "TEST__ERROR";
	public httpStatus = 400;
}

describe("multi-app-exception.ts", () => {
	describe("multiAppException", () => {
		it("stores multiple exceptions", () => {
			const err1 = new TestException("Error 1");
			const err2 = new TestException("Error 2");
			const multi = new MultiAppException([err1, err2]);

			expect(multi.exceptions).toHaveLength(2);
			expect(multi.exceptions[0]).toBe(err1);
			expect(multi.exceptions[1]).toBe(err2);
		});

		it("has default message", () => {
			const multi = new MultiAppException([]);

			expect(multi.message).toBe("Multiple exceptions occurred");
		});

		it("extends Error", () => {
			const multi = new MultiAppException([]);

			expect(multi).toBeInstanceOf(Error);
		});

		it("works with empty array", () => {
			const multi = new MultiAppException([]);

			expect(multi.exceptions).toHaveLength(0);
		});
	});
});
