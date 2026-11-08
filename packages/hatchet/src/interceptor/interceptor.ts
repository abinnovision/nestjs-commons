import type { ClientInterceptor } from "./client-interceptor.js";
import type { BaseCtx } from "../execution/index.js";

/**
 * Abstract class for intercepting task executions on the worker, including
 * each task of a workflow.
 * Implement this to add cross-cutting concerns like ALS, tracing, logging.
 *
 * For producer-side calls (`Client.emit`, `Client.run`), see {@link ClientInterceptor}.
 */
export abstract class TaskInterceptor {
	public abstract intercept<T>(
		ctx: BaseCtx<any>,
		next: () => Promise<T>,
	): Promise<T>;
}

/**
 * @deprecated Use {@link TaskInterceptor}.
 */
export const Interceptor = TaskInterceptor;

/**
 * @deprecated Use {@link TaskInterceptor}.
 */
export type Interceptor = TaskInterceptor;
