import { pipe } from "remeda";
import { describe, expect, it } from "vitest";

import { sanitizeString } from "./sanitize";

describe("string/sanitize.ts", () => {
	describe("#sanitizeString()", () => {
		it("removes HTML tags", () => {
			expect(sanitizeString("<b>Hello</b> World")).toBe("Hello World");
		});

		it("trims whitespace by default", () => {
			expect(sanitizeString("  Hello World  ")).toBe("Hello World");
		});

		it("collapses multiple whitespace", () => {
			expect(sanitizeString("Hello    World")).toBe("Hello World");
		});

		it("handles script tags", () => {
			expect(sanitizeString("<script>alert('xss')</script>Hello")).toBe(
				"Hello",
			);
		});

		it("handles nested tags", () => {
			expect(sanitizeString("<div><p>Hello</p></div>")).toBe("Hello");
		});

		it("respects trim: false option", () => {
			expect(sanitizeString("  Hello  ", { trim: false })).toBe(" Hello ");
		});

		it("works with remeda pipe (data-last)", () => {
			const result = pipe("<b>Hello</b>  World", sanitizeString());

			expect(result).toBe("Hello World");
		});

		it("works with remeda pipe and options (data-last)", () => {
			const result = pipe("  Hello  ", sanitizeString({ trim: false }));

			expect(result).toBe(" Hello ");
		});

		it("handles empty string", () => {
			expect(sanitizeString("")).toBe("");
		});

		it("handles only whitespace", () => {
			expect(sanitizeString("   ")).toBe("");
		});

		it("preserves Unicode characters", () => {
			expect(sanitizeString("Héllo Wörld")).toBe("Héllo Wörld");
		});
	});
});
