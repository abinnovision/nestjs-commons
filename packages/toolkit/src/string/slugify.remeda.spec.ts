import { pipe } from "remeda";
import { describe, expect, it } from "vitest";

import { slugify } from "./slugify.remeda";

describe("string/slugify.remeda.ts", () => {
	describe("#slugify()", () => {
		it("slugifies with defaults when no options are given", () => {
			expect(pipe("Hello World!", slugify())).toBe("hello-world");
		});

		it("forwards options to the underlying slugify", () => {
			expect(pipe("Hello World!", slugify({ separator: "_" }))).toBe(
				"hello_world",
			);
			expect(pipe("Hello World!", slugify({ maxLength: 5 }))).toBe("hello");
		});
	});
});
