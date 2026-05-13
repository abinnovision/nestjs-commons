import { describe, expect, it } from "vitest";

import { AttestorRunner } from "./attestor-runner.service";

import type { HealthAttestor, HealthCheckOutcome } from "../health-attestor";
import type { RegisteredAttestor } from "./attestor-runner.service";

const buildRegistered = (
	check: HealthAttestor["check"],
	overrides: Partial<RegisteredAttestor["options"]> = {},
): RegisteredAttestor => ({
	options: { name: "subject", ...overrides },
	instance: { check },
});

describe("runner/attestor-runner.service.ts", () => {
	describe("attestorRunner.execute()", () => {
		it("returns the attestor outcome on success", async () => {
			const runner = new AttestorRunner();
			const outcome: HealthCheckOutcome = { status: "ok" };

			const result = await runner.execute(buildRegistered(() => outcome));

			expect(result.outcome).toEqual(outcome);
			expect(result.durationMs).toBeGreaterThanOrEqual(0);
		});

		it("awaits async check() implementations", async () => {
			const runner = new AttestorRunner();
			const outcome: HealthCheckOutcome = { status: "ok" };

			const result = await runner.execute(
				buildRegistered(() => Promise.resolve(outcome)),
			);

			expect(result.outcome).toEqual(outcome);
		});

		it("converts a thrown error into a `down` outcome", async () => {
			const runner = new AttestorRunner();

			const result = await runner.execute(
				buildRegistered(() => {
					throw new Error("connection refused");
				}),
			);

			expect(result.outcome).toEqual({ status: "down" });
		});

		it("converts a rejected promise into a `down` outcome", async () => {
			const runner = new AttestorRunner();

			const result = await runner.execute(
				buildRegistered(() => Promise.reject(new Error("nope"))),
			);

			expect(result.outcome).toEqual({ status: "down" });
		});

		it("times out a slow check() and reports `down`", async () => {
			const runner = new AttestorRunner();

			const slow = (): Promise<HealthCheckOutcome> =>
				new Promise((resolve) => {
					setTimeout(() => {
						resolve({ status: "ok" });
					}, 200);
				});

			const result = await runner.execute(
				buildRegistered(slow, { timeoutMs: 20 }),
			);

			expect(result.outcome).toEqual({ status: "down" });
		});

		it("handles non-Error throwables by isolating them as `down`", async () => {
			const runner = new AttestorRunner();

			const result = await runner.execute(
				buildRegistered(() => {
					// eslint-disable-next-line @typescript-eslint/only-throw-error
					throw "string-error";
				}),
			);

			expect(result.outcome).toEqual({ status: "down" });
		});

		it("does not surface the underlying error message on the outcome", async () => {
			const runner = new AttestorRunner();

			const result = await runner.execute(
				buildRegistered(() => {
					throw new Error("internal: db password rotated");
				}),
			);

			expect(result.outcome).toEqual({ status: "down" });
			expect(JSON.stringify(result.outcome)).not.toContain("db password");
		});
	});
});
