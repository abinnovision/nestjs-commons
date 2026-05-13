/**
 * Options accepted by `HealthzModule.forRoot()`.
 *
 * All fields are optional; calling `HealthzModule.forRoot({})` is
 * equivalent to relying on every default.
 */
export interface HealthzModuleConfig {
	/**
	 * How much information to include in the response body.
	 *
	 * - `"full"` (default): full breakdown including per-attestor
	 *   status, duration, error message, and cache state.
	 * - `"summary"`: only the aggregate `{ status, timestamp }`.
	 * - `"none"`: empty body — only the HTTP status code carries
	 *   information.
	 *
	 * The HTTP status code is the same in all three modes: 503 when the
	 * aggregate status is `down`, 200 otherwise.
	 *
	 * @default "full"
	 */
	detail?: "full" | "summary" | "none";
}

/**
 * Injection token under which the resolved `HealthzModuleConfig` is
 * provided. Exported for advanced use; most consumers do not need to
 * reference it directly.
 */
export const HEALTHZ_MODULE_CONFIG_TOKEN = Symbol("healthz:module:config");
