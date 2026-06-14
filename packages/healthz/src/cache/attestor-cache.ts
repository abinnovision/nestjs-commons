import type { HealthCheckOutcome } from "../health-attestor.js";

interface CachedEntry {
	outcome: HealthCheckOutcome;
	durationMs: number;
	expiresAt: number;
}

/**
 * Snapshot returned for a cache hit. `durationMs` is the duration of
 * the original check (the cache lookup itself is effectively
 * instantaneous).
 */
export interface CachedSnapshot {
	outcome: HealthCheckOutcome;
	durationMs: number;
}

/**
 * Simple in-memory TTL cache for attestor outcomes.
 *
 * Keyed by attestor name. Entries expire after their TTL elapses; the
 * next read after expiry returns `undefined` so the caller can re-run
 * the underlying check.
 *
 * The cache is process-local — no external store, no synchronisation
 * across replicas. Each pod evaluates its own health independently.
 */
export class AttestorCache {
	private readonly entries = new Map<string, CachedEntry>();
	private readonly clock: () => number;

	public constructor(clock?: () => number) {
		this.clock = clock ?? ((): number => Date.now());
	}

	/**
	 * Returns the cached snapshot for `name` if still fresh; otherwise
	 * evicts the stale entry and returns `undefined`.
	 */
	public get(name: string): CachedSnapshot | undefined {
		const entry = this.entries.get(name);

		if (entry === undefined) {
			return undefined;
		}

		if (entry.expiresAt <= this.clock()) {
			this.entries.delete(name);

			return undefined;
		}

		return { outcome: entry.outcome, durationMs: entry.durationMs };
	}

	/**
	 * Stores `snapshot` under `name`, evicting it again after `ttlMs`.
	 * A non-positive `ttlMs` is a no-op.
	 */
	public set(name: string, snapshot: CachedSnapshot, ttlMs: number): void {
		if (ttlMs <= 0) {
			return;
		}

		this.entries.set(name, {
			outcome: snapshot.outcome,
			durationMs: snapshot.durationMs,
			expiresAt: this.clock() + ttlMs,
		});
	}
}
