import {
	TASK_MARKER,
	type BaseCtx,
	type TaskCtx,
	type WorkflowCtx,
} from "./context";
import { createHostRunForContext } from "../interaction/host-run/adapter-factory";

import type { AnyTaskFn, OutputOfTaskFn } from "../ref";

/**
 * Arguments for context factory functions.
 * Derived from BaseCtx using Pick to ensure type alignment.
 * `input` is optional and defaults to fromSDK.input.
 */
type CreateCtxArgs<I> = Pick<BaseCtx<I>, "fromSDK" | "triggerSource"> & {
	input: I;
};

/**
 * Helper methods derived from the SDK context.
 */
type ContextHelpers = Pick<BaseCtx<unknown>, "run">;

/**
 * Creates the helper methods derived from the SDK context.
 * These are methods that wrap SDK functionality.
 */
const createContextHelpers = <I>(
	fromSDK: BaseCtx<I>["fromSDK"],
): ContextHelpers => ({
	run: createHostRunForContext(fromSDK),
});

/**
 * Maps the args to the 1:1 context properties.
 */
const mapContextProperties = <I>(
	args: CreateCtxArgs<I>,
): Pick<BaseCtx<I>, "fromSDK" | "input" | "triggerSource"> => ({
	fromSDK: args.fromSDK,
	input: args.input,
	triggerSource: args.triggerSource,
});

/**
 * Creates a TaskCtx from SDK Context for standalone task execution.
 *
 * @param args The arguments for creating the task context.
 */
export const createTaskCtx = <I>(args: CreateCtxArgs<I>): TaskCtx<any> => {
	return {
		[TASK_MARKER]: true,
		...mapContextProperties(args),
		...createContextHelpers(args.fromSDK),
	};
};

/**
 * Creates a WorkflowCtx from SDK Context for workflow task execution.
 *
 * @param args The arguments for creating the workflow context.
 */
export const createWorkflowCtx = <I>(
	args: CreateCtxArgs<I>,
): WorkflowCtx<any> => {
	const parent = async <F extends AnyTaskFn<any, any>>(
		method: F,
	): Promise<OutputOfTaskFn<F>> => {
		const methodName = method.name;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return await args.fromSDK.parentOutput(methodName);
	};

	return {
		[TASK_MARKER]: true,
		...mapContextProperties(args),
		...createContextHelpers(args.fromSDK),
		parent,
	};
};
