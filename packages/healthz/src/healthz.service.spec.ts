import { describe, expect, it } from "vitest";

import { HealthzService } from "./healthz.service";

import type { AttestorExplorer } from "./explorer/attestor-explorer.service";
import type { HealthAttestor, HealthCheckOutcome } from "./health-attestor";
import type {
	AttestorRunner,
	RegisteredAttestor,
} from "./runner/attestor-runner.service";

const buildRegistered = (
	options: RegisteredAttestor["options"],
	check?: HealthAttestor["check"],
): RegisteredAttestor => ({
	options,
	instance: { check: check ?? ((): HealthCheckOutcome => ({ status: "ok" })) },
});

const stubExplorer = (attestors: RegisteredAttestor[]): AttestorExplorer =>
	({
		getAll: () => attestors,
	}) as unknown as AttestorExplorer;

const stubRunner = (
	results: Map<string, { outcome: HealthCheckOutcome; durationMs: number }>,
): AttestorRunner =>
	({
		execute: (attestor: RegisteredAttestor) => {
			const result = results.get(attestor.options.name);

			if (result === undefined) {
				return Promise.reject(
					new Error(`No stub for '${attestor.options.name}'`),
				);
			}

			return Promise.resolve(result);
		},
	}) as unknown as AttestorRunner;

describe("healthz.service.ts", () => {
	describe("healthzService.runAll()", () => {
		it("returns status 'ok' when all attestors succeed", async () => {
			const attestors = [
				buildRegistered({ name: "db" }),
				buildRegistered({ name: "redis" }),
			];
			const results = new Map([
				["db", { outcome: { status: "ok" } as const, durationMs: 10 }],
				["redis", { outcome: { status: "ok" } as const, durationMs: 5 }],
			]);

			const service = new HealthzService(
				stubExplorer(attestors),
				stubRunner(results),
			);

			const report = await service.runAll();

			expect(report.status).toBe("ok");
			expect(report.checks).toHaveLength(2);
			expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});

		it("returns status 'down' when a critical attestor fails", async () => {
			const attestors = [
				buildRegistered({ name: "db", critical: true }),
				buildRegistered({ name: "redis", critical: false }),
			];
			const results = new Map([
				["db", { outcome: { status: "down" } as const, durationMs: 10 }],
				["redis", { outcome: { status: "ok" } as const, durationMs: 5 }],
			]);

			const service = new HealthzService(
				stubExplorer(attestors),
				stubRunner(results),
			);

			const report = await service.runAll();

			expect(report.status).toBe("down");
		});

		it("returns status 'degraded' when only non-critical attestors fail", async () => {
			const attestors = [
				buildRegistered({ name: "db", critical: true }),
				buildRegistered({ name: "queue", critical: false }),
			];
			const results = new Map([
				["db", { outcome: { status: "ok" } as const, durationMs: 10 }],
				["queue", { outcome: { status: "down" } as const, durationMs: 7 }],
			]);

			const service = new HealthzService(
				stubExplorer(attestors),
				stubRunner(results),
			);

			const report = await service.runAll();

			expect(report.status).toBe("degraded");
		});

		it("defaults critical to true when unset", async () => {
			const attestors = [buildRegistered({ name: "db" })];
			const results = new Map([
				["db", { outcome: { status: "down" } as const, durationMs: 10 }],
			]);

			const service = new HealthzService(
				stubExplorer(attestors),
				stubRunner(results),
			);

			const report = await service.runAll();

			expect(report.status).toBe("down");
			expect(report.checks[0]?.critical).toBe(true);
		});

		it("rate-limits execution when minIntervalMs is set and reuses the previous outcome", async () => {
			const attestors = [
				buildRegistered({ name: "db", minIntervalMs: 60_000 }),
			];

			let executions = 0;
			const runner = {
				execute: () => {
					executions += 1;

					return Promise.resolve({
						outcome: { status: "ok" } as const,
						durationMs: 1,
					});
				},
			} as unknown as AttestorRunner;

			const service = new HealthzService(stubExplorer(attestors), runner);

			const first = await service.runAll();
			const second = await service.runAll();

			expect(executions).toBe(1);
			expect(first.checks[0]?.cached).toBe(false);
			expect(second.checks[0]?.cached).toBe(true);
		});

		it("re-runs uncached attestors on every call", async () => {
			const attestors = [buildRegistered({ name: "db" })];

			let executions = 0;
			const runner = {
				execute: () => {
					executions += 1;

					return Promise.resolve({
						outcome: { status: "ok" } as const,
						durationMs: 1,
					});
				},
			} as unknown as AttestorRunner;

			const service = new HealthzService(stubExplorer(attestors), runner);

			await service.runAll();
			await service.runAll();

			expect(executions).toBe(2);
		});

		it("preserves details in the report", async () => {
			const attestors = [buildRegistered({ name: "db" })];
			const results = new Map([
				[
					"db",
					{
						outcome: {
							status: "down" as const,
							details: { code: "E_DOWN", subsystem: "primary" },
						},
						durationMs: 10,
					},
				],
			]);

			const service = new HealthzService(
				stubExplorer(attestors),
				stubRunner(results),
			);

			const report = await service.runAll();

			expect(report.checks[0]?.details).toEqual({
				code: "E_DOWN",
				subsystem: "primary",
			});
		});
	});
});
