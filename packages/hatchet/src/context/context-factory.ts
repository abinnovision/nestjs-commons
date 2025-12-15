import { createHostRunForContext } from "../interaction/host-run/adapter-factory";

import type { AnyTaskFn, OutputOfTaskFn } from "../ref";
import type { TaskCtx, WorkflowCtx } from "./context";
import type { Context as HContext } from "@hatchet-dev/typescript-sdk";

/**
 * Creates a TaskCtx from SDK Context for standalone task execution.
 *
 * @param sdkCtx The SDK context.
 * @param validatedInput Optional validated/transformed input to use instead of raw SDK input.
 */
export function createTaskCtx<I>(
	sdkCtx: HContext<I, any>,
	validatedInput?: I,
): TaskCtx<any> {
	const run = createHostRunForContext(sdkCtx);

	// Cast needed because TASK_MARKER is a phantom type for compile-time detection only
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		fromSDK: sdkCtx,
		input: validatedInput ?? sdkCtx.input,
		run,
	} as TaskCtx<any>;
}

/**
 * Creates a WorkflowCtx from SDK Context for workflow task execution.
 *
 * @param sdkCtx The SDK context.
 * @param validatedInput Optional validated/transformed input to use instead of raw SDK input.
 */
export function createWorkflowCtx<I>(
	sdkCtx: HContext<I, any>,
	validatedInput?: I,
): WorkflowCtx<any> {
	const run = createHostRunForContext(sdkCtx);

	const parent = async <F extends AnyTaskFn<any, any>>(
		method: F,
	): Promise<OutputOfTaskFn<F>> => {
		const methodName = method.name;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return await sdkCtx.parentOutput(methodName);
	};

	// Cast needed because TASK_MARKER is a phantom type for compile-time detection only
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		fromSDK: sdkCtx,
		input: validatedInput ?? sdkCtx.input,
		run,
		parent,
	} as WorkflowCtx<any>;
}
