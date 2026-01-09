import {
	TASK_MARKER,
	type TaskCtx,
	type TriggerSource,
	type WorkflowCtx,
} from "./context";
import { createHostRunForContext } from "../interaction/host-run/adapter-factory";

import type { AnyTaskFn, OutputOfTaskFn } from "../ref";
import type { Context as HContext } from "@hatchet-dev/typescript-sdk";

/**
 * Creates a TaskCtx from SDK Context for standalone task execution.
 *
 * @param sdkCtx The SDK context.
 * @param triggerSource The source that triggered the task execution.
 * @param validatedInput Optional validated/transformed input to use instead of raw SDK input.
 */
export const createTaskCtx = <I>(
	sdkCtx: HContext<I, any>,
	triggerSource: TriggerSource,
	validatedInput?: I,
): TaskCtx<any> => {
	const run = createHostRunForContext(sdkCtx);

	return {
		[TASK_MARKER]: true,
		fromSDK: sdkCtx,
		input: validatedInput ?? sdkCtx.input,
		triggerSource,
		run,
	};
};

/**
 * Creates a WorkflowCtx from SDK Context for workflow task execution.
 *
 * @param sdkCtx The SDK context.
 * @param triggerSource The source that triggered the workflow execution.
 * @param validatedInput Optional validated/transformed input to use instead of raw SDK input.
 */
export const createWorkflowCtx = <I>(
	sdkCtx: HContext<I, any>,
	triggerSource: TriggerSource,
	validatedInput?: I,
): WorkflowCtx<any> => {
	const run = createHostRunForContext(sdkCtx);

	const parent = async <F extends AnyTaskFn<any, any>>(
		method: F,
	): Promise<OutputOfTaskFn<F>> => {
		const methodName = method.name;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return await sdkCtx.parentOutput(methodName);
	};

	return {
		[TASK_MARKER]: true,
		fromSDK: sdkCtx,
		input: validatedInput ?? sdkCtx.input,
		triggerSource,
		run,
		parent,
	};
};
