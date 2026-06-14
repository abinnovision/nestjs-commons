import { Injectable } from "@nestjs/common";

import { AttestorCache } from "./cache/attestor-cache.js";
import { AttestorExplorer } from "./explorer/attestor-explorer.service.js";
import { AttestorRunner } from "./runner/attestor-runner.service.js";

import type {
	HealthCheckOutcome,
	HealthCheckReport,
} from "./health-attestor.js";
import type { HealthStatus } from "./interfaces/health-status.js";
import type { RegisteredAttestor } from "./runner/attestor-runner.service.js";

/**
 * The aggregate report served by `/readyz` and `/healthz`.
 */
export interface AggregateReport {
	status: HealthStatus;
	checks: HealthCheckReport[];
	timestamp: string;
}

/**
 * Internal pairing of an attestor with the result of its most recent
 * execution. The `critical` flag is read off the attestor's options
 * when deriving the aggregate status, so it does not need to live on
 * the public report.
 */
interface AttestorRun {
	attestor: RegisteredAttestor;
	outcome: HealthCheckOutcome;
	durationMs: number;
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

		const runs = await Promise.all(
			attestors.map((attestor) => this.runOne(attestor)),
		);

		return {
			status: this.deriveStatus(runs),
			checks: runs.map((run) => this.toReport(run)),
			timestamp: new Date().toISOString(),
		};
	}

	private async runOne(attestor: RegisteredAttestor): Promise<AttestorRun> {
		const cached = this.cache.get(attestor.options.name);

		if (cached !== undefined) {
			return {
				attestor,
				outcome: cached.outcome,
				durationMs: cached.durationMs,
			};
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

		return { attestor, outcome, durationMs };
	}

	private toReport(run: AttestorRun): HealthCheckReport {
		const report: HealthCheckReport = {
			name: run.attestor.options.name,
			status: run.outcome.status,
			durationMs: run.durationMs,
		};

		if (run.outcome.details !== undefined) {
			report.details = run.outcome.details;
		}

		return report;
	}

	private deriveStatus(runs: readonly AttestorRun[]): HealthStatus {
		let degraded = false;

		for (const run of runs) {
			if (run.outcome.status === "down") {
				const critical = run.attestor.options.critical ?? true;

				if (critical) {
					return "down";
				}

				degraded = true;
			}
		}

		return degraded ? "degraded" : "ok";
	}
}
