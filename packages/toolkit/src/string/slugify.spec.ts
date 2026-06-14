import { describe, expect, it } from "vitest";

import { slugify } from "./slugify.js";

describe("string/slugify.ts", () => {
	describe("#slugify()", () => {
		it("converts basic string to slug", () => {
			expect(slugify("Hello World")).toBe("hello-world");
		});

		it("handles special characters", () => {
			expect(slugify("Hello, World!")).toBe("hello-world");
		});

		it("handles accented characters", () => {
			expect(slugify("Café résumé")).toBe("cafe-resume");
		});

		it("removes leading and trailing separators", () => {
			expect(slugify("---Hello---")).toBe("hello");
		});

		it("handles multiple spaces", () => {
			expect(slugify("Hello    World")).toBe("hello-world");
		});

		it("respects maxLength option", () => {
			expect(slugify("Hello World", { maxLength: 5 })).toBe("hello");
		});

		it("respects separator option", () => {
			expect(slugify("Hello World", { separator: "_" })).toBe("hello_world");
		});

		it("handles empty string", () => {
			expect(slugify("")).toBe("");
		});

		it("handles only special characters", () => {
			expect(slugify("!@#$%^&*()")).toBe("");
		});

		it("preserves numbers", () => {
			expect(slugify("Item 123")).toBe("item-123");
		});
	});
});
