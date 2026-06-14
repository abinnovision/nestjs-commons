import { describe, expect, it } from "vitest";

import { assertNever } from "./assert-never.js";

describe("assert/assert-never.ts", () => {
	describe("#assertNever()", () => {
		it("throws when reached at runtime", () => {
			expect(() => assertNever("unexpected" as never)).toThrow(Error);
		});

		it("includes the offending value in the error message", () => {
			expect(() => assertNever("foo" as never)).toThrow("Unhandled case: foo");
		});

		it("handles numeric values in the message", () => {
			expect(() => assertNever(42 as never)).toThrow("Unhandled case: 42");
		});
	});
});
