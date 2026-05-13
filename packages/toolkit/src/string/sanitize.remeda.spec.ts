import { pipe } from "remeda";
import { describe, expect, it } from "vitest";

import { sanitizeString } from "./sanitize.remeda";

describe("string/sanitize.remeda.ts", () => {
	describe("#sanitizeString()", () => {
		it("sanitizes with defaults when no options are given", () => {
			expect(
				pipe("<script>alert('xss')</script>Hello   World", sanitizeString()),
			).toBe("Hello World");
		});

		it("forwards options to the underlying sanitizeString", () => {
			expect(pipe("  Hello  ", sanitizeString({ trim: false }))).toBe(
				" Hello ",
			);
		});
	});
});
