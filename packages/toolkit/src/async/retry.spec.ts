import { afterEach, describe, expect, it, vi } from "vitest";

import { withRetry } from "./retry.js";

describe("async/retry.ts", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe("#withRetry()", () => {
		it("resolves with the value on first success", async () => {
			const fn = vi.fn<() => Promise<string>>().mockResolvedValue("ok");

			await expect(withRetry(fn, { retries: 3 })).resolves.toBe("ok");
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("retries on failure and resolves once it succeeds", async () => {
			const fn = vi
				.fn<() => Promise<string>>()
				.mockRejectedValueOnce(new Error("fail-1"))
				.mockRejectedValueOnce(new Error("fail-2"))
				.mockResolvedValue("ok");

			await expect(
				withRetry(fn, { retries: 5, minDelayMs: 0, jitter: 0 }),
			).resolves.toBe("ok");
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it("throws the last error after exhausting retries", async () => {
			const fn = vi
				.fn<() => Promise<never>>()
				.mockRejectedValueOnce(new Error("fail-1"))
				.mockRejectedValue(new Error("fail-final"));

			await expect(
				withRetry(fn, { retries: 2, minDelayMs: 0, jitter: 0 }),
			).rejects.toThrow("fail-final");
			// One initial attempt plus two retries.
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it("stops immediately when shouldRetry returns false", async () => {
			const error = new Error("fatal");
			const fn = vi.fn<() => Promise<never>>().mockRejectedValue(error);
			const shouldRetry = vi.fn(() => false);

			await expect(
				withRetry(fn, { retries: 5, minDelayMs: 0, shouldRetry }),
			).rejects.toBe(error);
			expect(fn).toHaveBeenCalledTimes(1);
			expect(shouldRetry).toHaveBeenCalledWith(error);
		});

		it("invokes onRetry once per retry with a 1-based attempt number", async () => {
			const fn = vi
				.fn<() => Promise<string>>()
				.mockRejectedValueOnce(new Error("fail-1"))
				.mockRejectedValueOnce(new Error("fail-2"))
				.mockResolvedValue("ok");
			const onRetry = vi.fn();

			await withRetry(fn, { retries: 5, minDelayMs: 0, jitter: 0, onRetry });

			expect(onRetry).toHaveBeenCalledTimes(2);
			expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1);
			expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2);
		});

		it("applies exponential backoff capped at maxDelayMs", async () => {
			vi.useFakeTimers();
			const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
			const fn = vi
				.fn<() => Promise<never>>()
				.mockRejectedValue(new Error("x"));

			const promise = withRetry(fn, {
				retries: 4,
				minDelayMs: 100,
				maxDelayMs: 500,
				factor: 2,
				jitter: 0,
			}).catch(() => "settled");

			await vi.runAllTimersAsync();
			await promise;

			const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
			// 100, 200, 400, then 800 capped to 500.
			expect(delays).toEqual([100, 200, 400, 500]);
		});

		it("does not invoke fn when the signal is already aborted", async () => {
			const controller = new AbortController();
			controller.abort();
			const fn = vi.fn<() => Promise<string>>().mockResolvedValue("ok");

			await expect(
				withRetry(fn, { retries: 3, signal: controller.signal }),
			).rejects.toBe(controller.signal.reason);
			expect(fn).not.toHaveBeenCalled();
		});

		it("aborts a pending backoff and rejects with the signal reason", async () => {
			vi.useFakeTimers();
			const controller = new AbortController();
			const fn = vi
				.fn<() => Promise<never>>()
				.mockRejectedValue(new Error("x"));

			// Swallow the rejection so driving the fake timers does not surface it
			// as an unhandled rejection before we assert on it.
			const guarded = withRetry(fn, {
				retries: 5,
				minDelayMs: 10_000,
				jitter: 0,
				signal: controller.signal,
			}).catch((error: unknown) => error);

			// Let the first attempt fail and schedule the backoff.
			await vi.advanceTimersByTimeAsync(0);
			expect(fn).toHaveBeenCalledTimes(1);

			controller.abort();

			await expect(guarded).resolves.toBe(controller.signal.reason);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("calls fn once and does not retry when retries is 0", async () => {
			const error = new Error("once");
			const fn = vi.fn<() => Promise<never>>().mockRejectedValue(error);
			const onRetry = vi.fn();

			await expect(withRetry(fn, { retries: 0, onRetry })).rejects.toBe(error);
			expect(fn).toHaveBeenCalledTimes(1);
			expect(onRetry).not.toHaveBeenCalled();
		});

		it("invokes onRetry once per retry but never for the final failure", async () => {
			const fn = vi
				.fn<() => Promise<never>>()
				.mockRejectedValue(new Error("x"));
			const onRetry = vi.fn();

			await expect(
				withRetry(fn, { retries: 2, minDelayMs: 0, jitter: 0, onRetry }),
			).rejects.toThrow("x");
			// Three attempts, two retries: onRetry fires twice, not for the throw.
			expect(onRetry).toHaveBeenCalledTimes(2);
		});

		it("rejects a negative retries count with a TypeError", async () => {
			const fn = vi.fn<() => Promise<string>>().mockResolvedValue("ok");

			await expect(withRetry(fn, { retries: -1 })).rejects.toThrow(TypeError);
			expect(fn).not.toHaveBeenCalled();
		});

		it("applies symmetric jitter within the configured fraction", async () => {
			vi.useFakeTimers();
			const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
			// rand=1 -> +jitter (upper bound), rand=0 -> -jitter (lower bound).
			vi.spyOn(Math, "random").mockReturnValueOnce(1).mockReturnValueOnce(0);
			const fn = vi
				.fn<() => Promise<never>>()
				.mockRejectedValue(new Error("x"));

			const promise = withRetry(fn, {
				retries: 2,
				minDelayMs: 1000,
				maxDelayMs: 100_000,
				factor: 1,
				jitter: 0.25,
			}).catch(() => "settled");

			await vi.runAllTimersAsync();
			await promise;

			const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
			// base stays 1000 (factor 1); +25% -> 1250, -25% -> 750.
			expect(delays).toEqual([1250, 750]);
		});

		it("never schedules a delay beyond maxDelayMs even with jitter", async () => {
			vi.useFakeTimers();
			const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
			// Force maximum positive jitter on every attempt.
			vi.spyOn(Math, "random").mockReturnValue(1);
			const fn = vi
				.fn<() => Promise<never>>()
				.mockRejectedValue(new Error("x"));

			const promise = withRetry(fn, {
				retries: 3,
				minDelayMs: 1000,
				maxDelayMs: 2000,
				factor: 10,
				jitter: 0.5,
			}).catch(() => "settled");

			await vi.runAllTimersAsync();
			await promise;

			const delays = setTimeoutSpy.mock.calls.map((call) => call[1] ?? 0);
			// Without the post-jitter clamp the base-capped 2000 would reach 3000.
			expect(Math.max(...delays)).toBe(2000);
		});

		it("does not invoke onRetry when the signal aborts during fn", async () => {
			const controller = new AbortController();
			const onRetry = vi.fn();
			const fn = vi.fn<() => Promise<never>>().mockImplementation(() => {
				controller.abort();
				return Promise.reject(new Error("fn-failed"));
			});

			const guarded = withRetry(fn, {
				retries: 3,
				minDelayMs: 0,
				jitter: 0,
				onRetry,
				signal: controller.signal,
			}).catch((error: unknown) => error);

			const result = await guarded;

			expect(result).toBe(controller.signal.reason);
			expect(onRetry).not.toHaveBeenCalled();
			expect(fn).toHaveBeenCalledTimes(1);
		});
	});
});
