import {
	type BaseCtx,
	type HostTriggerConfig,
	TASK_MARKER,
	type TaskCtx,
	type TriggerSource,
	type WorkflowCtx,
} from "./types";
import { createHostRunForContext } from "../host-run/adapter-factory";

import type { AnyEventDefinition, EventOutput } from "../../events";
import type { AnyTaskFn, OutputOfTaskFn } from "../../references/shared";

/**
 * Arguments for context factory functions.
 * Derived from BaseCtx using Pick to ensure type alignment.
 */
type CreateCtxArgs<I> = Pick<BaseCtx<I>, "fromSDK" | "triggerSource"> & {
	input: I;
	hostConfig: HostTriggerConfig;
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
 * Creates the trigger guard methods bound to the context's trigger source.
 */
const createTriggerGuards = (
	triggerSource: TriggerSource,
	input: unknown,
): Pick<BaseCtx<unknown>, "isRun" | "isEvent" | "isCron"> => ({
	isRun: (): this is BaseCtx<unknown> & { triggerSource: "run" } =>
		triggerSource === "run",
	isCron: (): this is BaseCtx<unknown> & {
		triggerSource: "cron";
		input: never;
	} => triggerSource === "cron",
	isEvent: <E extends AnyEventDefinition>(
		eventDef?: AnyEventDefinition,
	): this is BaseCtx<unknown> & {
		triggerSource: "event";
		input: E extends AnyEventDefinition ? EventOutput<E> : unknown;
	} => {
		if (triggerSource !== "event") {
			return false;
		}

		// If no event definition is provided, then we validate against any event.
		if (!eventDef) {
			return true;
		}

		return eventDef.isCtx({ input });
	},
});

/**
 * Maps the args to the 1:1 context properties.
 */
const mapContextProperties = <I>(
	args: CreateCtxArgs<I>,
): Pick<BaseCtx<I>, "fromSDK" | "input" | "triggerSource" | "hostConfig"> => ({
	fromSDK: args.fromSDK,
	input: args.input,
	triggerSource: args.triggerSource,
	hostConfig: args.hostConfig,
});

/**
 * Creates a TaskCtx from SDK Context for standalone task execution.
 *
 * @param args The arguments for creating the task context.
 */
export const createTaskCtx = <I>(args: CreateCtxArgs<I>): TaskCtx<any> => ({
	[TASK_MARKER]: true,
	...mapContextProperties(args),
	...createContextHelpers(args.fromSDK),
	...createTriggerGuards(args.triggerSource, args.input),
});

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
		...createTriggerGuards(args.triggerSource, args.input),
		parent,
	};
};
