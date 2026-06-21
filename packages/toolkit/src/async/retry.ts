/**
 * Pause for the given number of milliseconds. If the optional AbortSignal fires
 * first, the pending timer is cleared and the promise rejects with the signal's
 * reason.
 */
const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
	new Promise<void>((resolve, reject) => {
		signal?.throwIfAborted();

		// Auto-removes the abort listener once the timer resolves normally, so a
		// long-lived signal does not accumulate listeners across many sleeps.
		const cleanup = new AbortController();

		const timer = setTimeout(() => {
			cleanup.abort();
			resolve();
		}, ms);

		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- propagate the AbortSignal's reason verbatim
				reject(signal.reason);
			},
			{ signal: cleanup.signal },
		);
	});

/**
 * Configuration for {@link withRetry}.
 */
export interface RetryOptions {
	/**
	 * Number of retry attempts after the initial attempt. The operation is
	 * therefore invoked at most `retries + 1` times.
	 */
	retries: number;

	/**
	 * Base delay between attempts in milliseconds; grows exponentially with
	 * each attempt (see `factor`).
	 *
	 * @default 250
	 */
	minDelayMs?: number;

	/**
	 * Hard upper bound for a single backoff delay in milliseconds, enforced
	 * after jitter. Prevents exponential growth from producing unbounded waits.
	 *
	 * @default 30000
	 */
	maxDelayMs?: number;

	/**
	 * Multiplier applied to the delay on each successive attempt. A value of
	 * `2` doubles the delay every time.
	 *
	 * @default 2
	 */
	factor?: number;

	/**
	 * Fraction of random jitter applied to each delay to avoid thundering-herd
	 * retries. `0` disables jitter; `0.25` spreads each delay by +/-25%.
	 *
	 * @default 0.25
	 */
	jitter?: number;

	/**
	 * Decide whether a given error is retryable. Defaults to always retry.
	 */
	shouldRetry?: (error: unknown) => boolean;

	/**
	 * Invoked before each retry with the error and the upcoming attempt number
	 * (1-based).
	 */
	onRetry?: (error: unknown, attempt: number) => void;

	/**
	 * Optional signal to abort the retry loop. When aborted, any pending
	 * backoff stops immediately and the call rejects with the signal's reason.
	 */
	signal?: AbortSignal;
}

/**
 * Retry an async operation with exponential backoff and jitter.
 *
 * A small local helper is used instead of `p-retry` because that package is
 * ESM-only, while this library is published as both ESM and CommonJS; a
 * `require()` of an ESM-only dependency would fail the package's CJS
 * resolution gate.
 *
 * The `signal` aborts the retry loop itself — a pending backoff is interrupted
 * and no further attempts are made — but it is NOT forwarded to `fn`. To cancel
 * an in-flight `fn()` call as well, `fn` must observe the same signal (e.g. pass
 * it to `fetch`).
 *
 * @example
 * ```typescript
 * const data = await withRetry(() => fetchFlaky(), {
 *   retries: 3,
 *   shouldRetry: (error) => !(error instanceof FatalError),
 *   signal: AbortSignal.timeout(5_000),
 * });
 * ```
 *
 * @param fn - The operation to run.
 * @param options - Retry behaviour configuration.
 * @returns The resolved value of the operation.
 * @throws TypeError if `retries` is not a non-negative integer.
 * @throws The last error if all attempts fail, or the signal's reason if aborted.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions,
): Promise<T> {
	const {
		retries,
		minDelayMs = 250,
		maxDelayMs = 30_000,
		factor = 2,
		jitter = 0.25,
		shouldRetry = (): boolean => true,
		onRetry,
		signal,
	} = options;

	if (!Number.isInteger(retries) || retries < 0) {
		throw new TypeError("withRetry: `retries` must be a non-negative integer.");
	}

	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		signal?.throwIfAborted();

		try {
			// eslint-disable-next-line no-await-in-loop -- sequential retry is intentional
			return await fn();
		} catch (error) {
			lastError = error;

			// If the signal aborted while fn was running, reject with the abort
			// reason now instead of firing onRetry for a retry that cannot happen.
			signal?.throwIfAborted();

			if (attempt === retries || !shouldRetry(error)) {
				break;
			}

			onRetry?.(error, attempt + 1);

			const base = Math.min(minDelayMs * factor ** attempt, maxDelayMs);
			const jittered = base + base * jitter * (Math.random() * 2 - 1);
			const delayMs = Math.min(maxDelayMs, Math.max(0, Math.round(jittered)));

			// eslint-disable-next-line no-await-in-loop -- backoff delay between attempts
			await sleep(delayMs, signal);
		}
	}

	throw lastError;
}
