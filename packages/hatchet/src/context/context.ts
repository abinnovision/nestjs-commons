import type { TaskHost, WorkflowHost } from "../abstracts";
import type { HostRunFn } from "../interaction";
import type { AnyTaskFn, OutputOfTaskFn } from "../ref";
import type { Context } from "@hatchet-dev/typescript-sdk";

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
	fromSDK: Context<I, any>;

	/**
	 * The input to the task.
	 */
	input: I;

	/**
	 * Function to run other tasks within the context of this task.
	 */
	run: HostRunFn;
}

/**
 * Context type of the run of a standalone task.
 */
export type TaskCtx<T extends TaskHost<any>> = BaseCtx<
	T extends TaskHost<infer I> ? I : never
>;

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
};
