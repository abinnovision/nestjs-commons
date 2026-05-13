import { applyDecorators, Injectable, SetMetadata } from "@nestjs/common";

import { METADATA_KEY_HEALTH_ATTESTOR } from "./metadata/keys";

import type { HealthStatus } from "./interfaces/health-status";

/**
 * The outcome of a single attestor's check.
 *
 * Attestors report only `ok` or `down` for their own subsystem; the
 * three-state `degraded` value is derived by the aggregator when a
 * non-critical attestor is down.
 *
 * Thrown exceptions in `check()` are caught by the runner and
 * surfaced as `{ status: "down" }`. The underlying error message is
 * logged for diagnostics but is intentionally not exposed in the
 * outcome so that probe responses cannot leak internal error text.
 */
export interface HealthCheckOutcome {
	/**
	 * The status reported by the attestor for its own subsystem.
	 */
	status: Exclude<HealthStatus, "degraded">;

	/**
	 * Optional structured details surfaced in the response payload
	 * under `checks[].details`.
	 *
	 * Values are restricted to strings to keep the response payload
	 * predictable and avoid accidental serialisation of unbounded
	 * objects, errors, or non-JSON-safe values.
	 */
	details?: Record<string, string>;
}

/**
 * Contract that any class decorated with `@HealthAttestor()` must
 * implement.
 *
 * An attestor lives inside its source module (e.g. `DatabaseModule`)
 * and has full DI access to the services it needs to probe.
 */
export interface HealthAttestor {
	/**
	 * Probe the subsystem and return its current health.
	 *
	 * Implementations should resolve within the configured per-attestor
	 * timeout. Thrown exceptions are caught by the runner and converted
	 * to `{ status: "down" }`, so raising an error is a valid way to
	 * signal a failed check — the error message is logged for
	 * diagnostics but not included in the probe response.
	 */
	check: () => Promise<HealthCheckOutcome> | HealthCheckOutcome;
}

/**
 * Options passed to the `@HealthAttestor()` decorator.
 */
export interface HealthAttestorOptions {
	/**
	 * Unique name for this attestor. Surfaces in the response under
	 * `checks[].name`. Should be unique across all attestors registered
	 * with a given `HealthzModule`; duplicates are tolerated but produce
	 * a startup warning.
	 */
	name: string;

	/**
	 * Whether failure of this check should mark the overall application
	 * as `down` (HTTP 503). Non-critical failures only mark the overall
	 * status as `degraded` and still respond with HTTP 200.
	 *
	 * @default true
	 */
	critical?: boolean;

	/**
	 * Minimum interval between actual executions of `check()`, in
	 * milliseconds. When set, requests that arrive sooner than this
	 * after the previous execution receive the previous outcome rather
	 * than triggering a new check.
	 *
	 * Primarily a guard against probe traffic flooding the underlying
	 * subsystem — `/readyz` may be polled by liveness controllers,
	 * load balancers, and dashboards simultaneously; this caps the
	 * actual call rate to the subsystem at `1 / minIntervalMs`.
	 *
	 * When unset, the check runs on every request.
	 */
	minIntervalMs?: number;

	/**
	 * Per-attestor execution timeout in milliseconds. If `check()` does
	 * not resolve within this window the outcome is recorded as `down`.
	 *
	 * @default 2000
	 */
	timeoutMs?: number;
}

/**
 * A single attestor entry in the aggregated response payload.
 */
export interface HealthCheckReport {
	name: string;
	status: HealthStatus;
	durationMs: number;
	details?: Record<string, string>;
}

/**
 * Marks a class as a health attestor.
 *
 * The decorator applies `@Injectable()` internally — matching how
 * `@Controller()` and `@Resolver()` work in NestJS — so consumers do
 * not need to decorate the class with `@Injectable()` separately. The
 * class must still be listed in its owning module's `providers` array
 * for NestJS to instantiate it.
 *
 * @example
 * ```ts
 * @HealthAttestor({ name: "database", critical: true })
 * export class DatabaseAttestor implements HealthAttestor {
 *   public constructor(private readonly db: DatabaseService) {}
 *
 *   public async check(): Promise<HealthCheckOutcome> {
 *     await this.db.query("SELECT 1");
 *     return { status: "ok" };
 *   }
 * }
 * ```
 */
export const HealthAttestor = (
	options: HealthAttestorOptions,
): ClassDecorator =>
	applyDecorators(
		Injectable(),
		SetMetadata(METADATA_KEY_HEALTH_ATTESTOR, options),
	);
