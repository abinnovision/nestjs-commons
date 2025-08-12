import type { TaskHost, WorkflowHost } from "../abstracts";
import type {
	AnyCallableRef,
	AnyTaskFn,
	InputOfRef,
	OutputOfRef,
	OutputOfTaskFn,
} from "../ref";
import type { HatchetInputType } from "../types";
import type { Context as HContext, RunOpts } from "@hatchet-dev/typescript-sdk";
import type WorkflowRunRef from "@hatchet-dev/typescript-sdk/util/workflow-run-ref";

interface CallableRunOpts<W extends boolean> extends RunOpts {
	/**
	 * Whether to wait for the task to complete before returning.
	 *
	 * @default true
	 */
	wait?: W;
}

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
 * Context type for running child tasks.
 */
export interface CtxCallables {
	run: <
		R extends AnyCallableRef,
		I extends InputOfRef<R> | InputOfRef<R>[],
		W extends boolean = true,
	>(
		ref: R,
		input: I,
		options?: CallableRunOpts<W>,
	) => Promise<
		I extends InputOfRef<R>[]
			? W extends true
				? OutputOfRef<R>[]
				: WorkflowRunRef<OutputOfRef<R>>[]
			: W extends true
				? OutputOfRef<R>
				: WorkflowRunRef<OutputOfRef<R>>
	>;
}

/**
 * Context type of the run of a standalone task.
 */
export type CtxTask<T extends TaskHost<any>> = BaseCtx<
	T extends TaskHost<infer I> ? I : never
> &
	CtxCallables;

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
} & CtxCallables;
