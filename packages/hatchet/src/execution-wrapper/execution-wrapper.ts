import type { BaseCtx } from "../context";

/**
 * Token for optional execution wrapper injection.
 * Register a provider with this token to wrap task/workflow execution.
 */
export const EXECUTION_WRAPPER = Symbol("hatchet:execution-wrapper");

/**
 * Abstract class for wrapping task/workflow execution.
 * Implement this to add cross-cutting concerns like ALS, tracing, logging.
 */
export abstract class ExecutionWrapper {
	public abstract wrap<T>(
		ctx: BaseCtx<any>,
		next: () => Promise<T>,
	): Promise<T>;
}
