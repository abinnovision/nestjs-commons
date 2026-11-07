import type { ClientInterceptor } from "./client-interceptor.js";
import type { BaseCtx } from "../execution/index.js";

/**
 * Abstract class for intercepting task/workflow execution on the worker.
 * Implement this to add cross-cutting concerns like ALS, tracing, logging.
 *
 * For producer-side calls (`Client.emit`, `Client.run`), see {@link ClientInterceptor}.
 */
export abstract class Interceptor {
	public abstract intercept<T>(
		ctx: BaseCtx<any>,
		next: () => Promise<T>,
	): Promise<T>;
}
