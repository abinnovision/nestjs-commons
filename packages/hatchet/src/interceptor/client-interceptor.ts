import type { TaskInterceptor } from "./interceptor.js";
import type { AnyEventDefinition } from "../events/index.js";
import type { HostRunOpts } from "../execution/host-run/function-type.js";
import type { AnyCallableRef } from "../references/index.js";
import type { HatchetClient } from "@hatchet-dev/typescript-sdk";

/**
 * Options accepted by `Client.emit`.
 */
export type EmitOptions = Parameters<HatchetClient["events"]["push"]>[2];

/**
 * Options accepted by `Client.run`. `wait` is excluded, as it cannot be changed by
 * an interceptor. `childKey` has no effect on `Client.run`.
 */
export type RunOptions = Omit<HostRunOpts<boolean>, "wait">;

/**
 * Context of an intercepted `Client.emit` call.
 */
export interface EmitCtx {
	readonly event: AnyEventDefinition;
	/** Payload(s) as passed by the caller. An array means a bulk emit. */
	readonly input: unknown;
	readonly options: EmitOptions | undefined;
}

/**
 * Context of an intercepted `Client.run` call.
 */
export interface RunCtx {
	readonly ref: AnyCallableRef;
	/** Task or workflow name resolved from the ref. */
	readonly name: string;
	/** Input(s) as passed by the caller. An array means multiple runs. */
	readonly input: unknown;
	readonly options: RunOptions | undefined;
}

/**
 * Abstract class for intercepting producer-side calls on `Client`.
 * Implement at least one method. Interceptors run once per call, in registration
 * order (first = outermost), and may only replace options through `next(options)`.
 * `next()` and `next(undefined)` keep the current options.
 *
 * For worker-side execution, see {@link TaskInterceptor}.
 */
export abstract class ClientInterceptor {
	/**
	 * Intercepts `Client.emit` (single and bulk) and `Client.emitBulk`.
	 */
	public interceptEmit?(
		ctx: EmitCtx,
		next: (options?: EmitOptions) => Promise<unknown>,
	): Promise<unknown>;

	/**
	 * Intercepts `Client.run`. With `wait: true` (default) the call spans the whole
	 * run including awaiting the output; with `wait: false` only the enqueue.
	 */
	public interceptRun?(
		ctx: RunCtx,
		next: (options?: RunOptions) => Promise<unknown>,
	): Promise<unknown>;
}
