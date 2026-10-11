import type { BaseCtx } from "../execution/index.js";

/**
 * Abstract class for intercepting task/workflow execution.
 * Implement this to add cross-cutting concerns like ALS, tracing, logging.
 */
export abstract class Interceptor {
	public abstract intercept<T>(
		ctx: BaseCtx<any>,
		next: () => Promise<T>,
	): Promise<T>;
}
