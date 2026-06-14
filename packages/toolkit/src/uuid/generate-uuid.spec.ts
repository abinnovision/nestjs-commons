import { describe, expect, it } from "vitest";

import { generateUUID } from "./generate-uuid.js";
import { isUUID } from "./is-uuid.js";
import { UUID_NAMESPACE_DNS, UUID_NAMESPACE_URL } from "./uuid-namespaces.js";

describe("uuid/generate-uuid.ts", () => {
	describe("#generateUUID()", () => {
		it("generates a valid UUID", () => {
			const uuid = generateUUID();

			expect(isUUID(uuid)).toBe(true);
		});

		it("generates unique UUIDs", () => {
			const uuid1 = generateUUID();
			const uuid2 = generateUUID();

			expect(uuid1).not.toBe(uuid2);
		});

		it("generates UUID in correct v4 format", () => {
			const uuid = generateUUID();

			expect(uuid).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});
	});

	describe("#generateUUID({ version: 5 })", () => {
		it("generates a valid UUID", () => {
			const uuid = generateUUID({
				version: 5,
				namespace: UUID_NAMESPACE_DNS,
				name: "example.com",
			});

			expect(isUUID(uuid)).toBe(true);
		});

		it("is deterministic — same namespace and name always produce the same UUID", () => {
			const opts = {
				version: 5 as const,
				namespace: UUID_NAMESPACE_DNS,
				name: "example.com",
			};

			expect(generateUUID(opts)).toBe(generateUUID(opts));
		});

		it("produces different UUIDs for different names", () => {
			const uuid1 = generateUUID({
				version: 5,
				namespace: UUID_NAMESPACE_DNS,
				name: "a.com",
			});
			const uuid2 = generateUUID({
				version: 5,
				namespace: UUID_NAMESPACE_DNS,
				name: "b.com",
			});

			expect(uuid1).not.toBe(uuid2);
		});

		it("produces different UUIDs for different namespaces", () => {
			const uuid1 = generateUUID({
				version: 5,
				namespace: UUID_NAMESPACE_DNS,
				name: "test",
			});
			const uuid2 = generateUUID({
				version: 5,
				namespace: UUID_NAMESPACE_URL,
				name: "test",
			});

			expect(uuid1).not.toBe(uuid2);
		});
	});

	describe("#generateUUID({ version: 7 })", () => {
		it("generates a valid UUID", () => {
			const uuid = generateUUID({ version: 7 });

			expect(isUUID(uuid)).toBe(true);
		});

		it("generates unique UUIDs", () => {
			const uuid1 = generateUUID({ version: 7 });
			const uuid2 = generateUUID({ version: 7 });

			expect(uuid1).not.toBe(uuid2);
		});

		it("generates UUID in correct v7 format", () => {
			const uuid = generateUUID({ version: 7 });

			expect(uuid).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});

		it("later UUIDs sort after earlier ones", async () => {
			const uuid1 = generateUUID({ version: 7 });

			await new Promise<void>((resolve) => {
				setTimeout(resolve, 1);
			});

			const uuid2 = generateUUID({ version: 7 });

			expect(uuid2 > uuid1).toBe(true);
		});
	});
});
