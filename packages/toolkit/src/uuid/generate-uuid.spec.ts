import { describe, expect, it } from "vitest";

import { generateUuid } from "./generate-uuid";
import { isUuid } from "./is-uuid";

describe("uuid/generate-uuid.ts", () => {
	describe("#generateUuid()", () => {
		it("generates a valid UUID", () => {
			const uuid = generateUuid();

			expect(isUuid(uuid)).toBe(true);
		});

		it("generates unique UUIDs", () => {
			const uuid1 = generateUuid();
			const uuid2 = generateUuid();

			expect(uuid1).not.toBe(uuid2);
		});

		it("generates UUID in correct format", () => {
			const uuid = generateUuid();

			expect(uuid).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});
	});
});
