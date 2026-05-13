import { Injectable } from "@nestjs/common";

import { AttestorCache } from "./cache/attestor-cache";
import { AttestorExplorer } from "./explorer/attestor-explorer.service";
import { AttestorRunner } from "./runner/attestor-runner.service";

import type { HealthCheckOutcome, HealthCheckReport } from "./health-attestor";
import type { HealthStatus } from "./interfaces/health-status";
import type { RegisteredAttestor } from "./runner/attestor-runner.service";

/**
 * The aggregate report served by `/readyz` and `/healthz`.
 */
export interface AggregateReport {
	status: HealthStatus;
	checks: HealthCheckReport[];
	timestamp: string;
}

/**
 * Orchestrates execution of all discovered attestors and computes the
 * aggregate status.
 *
 * Attestors are run in parallel via `Promise.all`. Each invocation is
 * isolated by the runner so a failure or timeout in one attestor
 * cannot affect the others. Cache lookups happen before invocation;
 * cache writes happen after.
 */
@Injectable()
export class HealthzService {
	private readonly cache: AttestorCache;

	public constructor(
		private readonly explorer: AttestorExplorer,
		private readonly runner: AttestorRunner,
	) {
		this.cache = new AttestorCache();
	}

	public async runAll(): Promise<AggregateReport> {
		const attestors = this.explorer.getAll();

		const checks = await Promise.all(
			attestors.map((attestor) => this.runOne(attestor)),
		);

		return {
			status: this.deriveStatus(checks),
			checks,
			timestamp: new Date().toISOString(),
		};
	}

	private async runOne(
		attestor: RegisteredAttestor,
	): Promise<HealthCheckReport> {
		const cached = this.cache.get(attestor.options.name);

		if (cached !== undefined) {
			return this.toReport(attestor, {
				outcome: cached.outcome,
				durationMs: cached.durationMs,
				cached: true,
			});
		}

		const { outcome, durationMs } = await this.runner.execute(attestor);

		const minIntervalMs = attestor.options.minIntervalMs;

		if (minIntervalMs !== undefined) {
			this.cache.set(
				attestor.options.name,
				{ outcome, durationMs },
				minIntervalMs,
			);
		}

		return this.toReport(attestor, { outcome, durationMs, cached: false });
	}

	private toReport(
		attestor: RegisteredAttestor,
		result: {
			outcome: HealthCheckOutcome;
			durationMs: number;
			cached: boolean;
		},
	): HealthCheckReport {
		const report: HealthCheckReport = {
			name: attestor.options.name,
			status: result.outcome.status,
			critical: attestor.options.critical ?? true,
			durationMs: result.durationMs,
			cached: result.cached,
		};

		if (result.outcome.details !== undefined) {
			report.details = result.outcome.details;
		}

		return report;
	}

	private deriveStatus(checks: readonly HealthCheckReport[]): HealthStatus {
		let degraded = false;

		for (const check of checks) {
			if (check.status === "down") {
				if (check.critical) {
					return "down";
				}

				degraded = true;
			}
		}

		return degraded ? "degraded" : "ok";
	}
}
