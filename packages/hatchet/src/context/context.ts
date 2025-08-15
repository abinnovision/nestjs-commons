import type { TaskHost, WorkflowHost } from "../abstracts";
import type { AnyTaskFn, OutputOfTaskFn } from "../ref";
import type { HatchetInputType, WorkflowCallable } from "../types";
import type { Context as HContext } from "@hatchet-dev/typescript-sdk";

/**
 * Type for the context when a task is running. This is universal for standalone and workflow tasks.
 * This partially implements the `Context` type from the SDK.
 *
 * @type {HatchetInputType} T The input type of the task.
 */
export interface BaseCtx<T extends HatchetInputType> {
	/**
	 * Provides access to the underlying SDK context.
	 */
	fromSDK: HContext<T, any>;

	/**
	 * The input to the task.
	 */
	input: T;
}

/**
 * Context type of the run of a standalone task.
 */
export type CtxTask<T extends TaskHost<any>> = BaseCtx<
	T extends TaskHost<infer I> ? I : never
> &
	WorkflowCallable;

/**
 * Context type of the run of a workflow task.
 */
export type CtxWorkflow<T extends WorkflowHost<any>> = BaseCtx<
	T extends WorkflowHost<infer I> ? I : never
> & {
	/**
	 * Provides the output of a parent task.
	 */
	parent: <F extends AnyTaskFn<any, any>>(
		method: F,
	) => Promise<OutputOfTaskFn<F>>;
} & WorkflowCallable;
