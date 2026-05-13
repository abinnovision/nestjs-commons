/**
 * Aggregate health status used by both per-attestor outcomes and the
 * overall `/readyz` response.
 *
 * - `ok` — fully operational.
 * - `degraded` — one or more non-critical checks failed; the
 *   application should still serve traffic.
 * - `down` — at least one critical check failed; the application
 *   should not serve traffic.
 */
export type HealthStatus = "ok" | "degraded" | "down";
