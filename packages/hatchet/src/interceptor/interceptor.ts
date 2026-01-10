import type { BaseCtx } from "../execution";

/**
 * Token for optional interceptors injection.
 * Register providers with this token to intercept task/workflow execution.
 */
export const INTERCEPTORS = Symbol("hatchet:interceptors");

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
