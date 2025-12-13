import type { TaskHost, WorkflowHost } from "../abstracts";
import type { AnyTaskFn, OutputOfTaskFn } from "../ref";
import type { WorkflowCallable } from "../types";
import type { Context as HContext } from "@hatchet-dev/typescript-sdk";

/**
 * Type for the context when a task is running. This is universal for standalone and workflow tasks.
 * This partially implements the `Context` type from the SDK.
 *
 * @template I The input type of the task.
 */
export interface BaseCtx<I> {
	/**
	 * Provides access to the underlying SDK context.
	 */
	fromSDK: HContext<I, any>;

	/**
	 * The input to the task.
	 */
	input: I;
}

/**
 * Context type of the run of a standalone task.
 */
export type TaskCtx<T extends TaskHost<any>> = BaseCtx<
	T extends TaskHost<infer I> ? I : never
> &
	WorkflowCallable;

/**
 * Context type of the run of a workflow task.
 */
export type WorkflowCtx<T extends WorkflowHost<any>> = BaseCtx<
	T extends WorkflowHost<infer I> ? I : never
> & {
	/**
	 * Provides the output of a parent task.
	 */
	parent: <F extends AnyTaskFn<any, any>>(
		method: F,
	) => Promise<OutputOfTaskFn<F>>;
} & WorkflowCallable;
