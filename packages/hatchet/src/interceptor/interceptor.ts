import type { BaseCtx } from "../context";

/**
 * Token for optional interceptor injection.
 * Register a provider with this token to intercept task/workflow execution.
 */
export const INTERCEPTOR = Symbol("hatchet:interceptor");

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
