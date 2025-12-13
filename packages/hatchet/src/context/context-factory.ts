import { createHostRunForContext } from "../interaction";

import type { AnyTaskFn, OutputOfTaskFn } from "../ref";
import type { TaskCtx, WorkflowCtx } from "./context";
import type { Context as HContext } from "@hatchet-dev/typescript-sdk";

/**
 * Creates a TaskCtx from SDK Context for standalone task execution.
 *
 * @param sdkCtx The SDK context.
 */
export function createTaskCtx<I>(sdkCtx: HContext<I, any>): TaskCtx<any> {
	const run = createHostRunForContext(sdkCtx);

	return {
		fromSDK: sdkCtx,
		input: sdkCtx.input,
		run,
	};
}

/**
 * Creates a WorkflowCtx from SDK Context for workflow task execution.
 *
 * @param sdkCtx The SDK context.
 */
export function createWorkflowCtx<I>(
	sdkCtx: HContext<I, any>,
): WorkflowCtx<any> {
	const run = createHostRunForContext(sdkCtx);

	const parent = async <F extends AnyTaskFn<any, any>>(
		method: F,
	): Promise<OutputOfTaskFn<F>> => {
		const methodName = method.name;
		return await sdkCtx.parentOutput(methodName);
	};

	return {
		fromSDK: sdkCtx,
		input: sdkCtx.input,
		run,
		parent,
	};
}
