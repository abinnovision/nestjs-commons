import { describe, expect, it } from "vitest";

import { AttestorCache } from "./attestor-cache";

import type { HealthCheckOutcome } from "../health-attestor";

const okOutcome: HealthCheckOutcome = { status: "ok" };

describe("cache/attestor-cache.ts", () => {
	describe("attestorCache", () => {
		it("returns undefined for an unknown name", () => {
			const cache = new AttestorCache();

			expect(cache.get("missing")).toBeUndefined();
		});

		it("returns the stored snapshot before the TTL elapses", () => {
			let now = 1000;
			const cache = new AttestorCache(() => now);

			cache.set("db", { outcome: okOutcome, durationMs: 12 }, 5000);
			now = 4999;

			expect(cache.get("db")).toEqual({ outcome: okOutcome, durationMs: 12 });
		});

		it("evicts and returns undefined once the TTL elapses", () => {
			let now = 1000;
			const cache = new AttestorCache(() => now);

			cache.set("db", { outcome: okOutcome, durationMs: 12 }, 5000);
			now = 6001;

			expect(cache.get("db")).toBeUndefined();
		});

		it("ignores a non-positive TTL", () => {
			const cache = new AttestorCache();

			cache.set("db", { outcome: okOutcome, durationMs: 12 }, 0);
			cache.set("db", { outcome: okOutcome, durationMs: 12 }, -1);

			expect(cache.get("db")).toBeUndefined();
		});

		it("caches a `down` outcome when the consumer opted in", () => {
			let now = 1000;
			const cache = new AttestorCache(() => now);
			const downOutcome: HealthCheckOutcome = { status: "down" };

			cache.set("db", { outcome: downOutcome, durationMs: 7 }, 5000);
			now = 1500;

			expect(cache.get("db")).toEqual({
				outcome: downOutcome,
				durationMs: 7,
			});
		});
	});
});
