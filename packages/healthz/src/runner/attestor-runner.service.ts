import { Injectable, Logger } from "@nestjs/common";

import type {
	HealthAttestor,
	HealthAttestorOptions,
	HealthCheckOutcome,
} from "../health-attestor.js";

const DEFAULT_TIMEOUT_MS = 2000;

/**
 * Executes a single attestor with timeout and exception isolation.
 *
 * No exception escapes `execute()` — anything thrown by the attestor's
 * `check()` is converted to a `{ status: "down" }` outcome. Timeouts
 * produce the same shape. The underlying error message is logged so
 * operators can diagnose a failing check, but it is intentionally not
 * placed on the outcome so that probe responses never leak internal
 * error text to callers.
 */
@Injectable()
export class AttestorRunner {
	private static readonly LOGGER = new Logger(AttestorRunner.name);

	public async execute(attestor: RegisteredAttestor): Promise<ExecutionResult> {
		const timeoutMs = attestor.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		const start = Date.now();

		try {
			const outcome = await this.withTimeout(
				Promise.resolve(attestor.instance.check()),
				timeoutMs,
			);

			return { outcome, durationMs: Date.now() - start };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);

			AttestorRunner.LOGGER.warn(
				`Attestor '${attestor.options.name}' reported down: ${message}`,
			);

			return {
				outcome: { status: "down" },
				durationMs: Date.now() - start,
			};
		}
	}

	private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		let timer: ReturnType<typeof setTimeout> | undefined;

		const timeout = new Promise<never>((_, reject) => {
			timer = setTimeout(() => {
				reject(new Error("timeout"));
			}, ms);
		});

		try {
			return await Promise.race([promise, timeout]);
		} finally {
			if (timer !== undefined) {
				clearTimeout(timer);
			}
		}
	}
}

/**
 * A bound pair of attestor metadata and its DI-instantiated provider,
 * produced by the explorer and consumed by the runner.
 */
export interface RegisteredAttestor {
	options: HealthAttestorOptions;
	instance: HealthAttestor;
}

/**
 * The result of executing a single attestor — its reported outcome
 * and the wall-clock duration of the call.
 */
export interface ExecutionResult {
	outcome: HealthCheckOutcome;
	durationMs: number;
}
