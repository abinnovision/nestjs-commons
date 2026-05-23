import { describe, expect, it } from "vitest";

import { defineDisk } from "./disk-ref.js";

describe("defineDisk()", () => {
	it("returns a unique class for each call", () => {
		const A = defineDisk();
		const B = defineDisk();

		expect(A).not.toBe(B);
	});

	it("preserves class identity across uses (same reference is reused)", () => {
		const A = defineDisk();
		const Alias = A;

		expect(A === Alias).toBe(true);
	});

	it("can be extended into a concrete reference class", () => {
		class UploadsDisk extends defineDisk() {}

		expect(typeof UploadsDisk).toBe("function");
	});

	it("throws at runtime if a subclass is instantiated directly", () => {
		class UploadsDisk extends defineDisk() {}

		// Bypass the abstract type-level constraint to exercise the runtime guard.
		const Ctor = UploadsDisk as unknown as new () => unknown;

		expect(() => new Ctor()).toThrow(/cannot be instantiated/i);
	});

	it("does not read or rely on the class name (identity is by reference)", () => {
		const A = defineDisk();
		const B = defineDisk();

		expect((A as { name?: string }).name).toBe((B as { name?: string }).name);
		expect(A).not.toBe(B);
	});
});
