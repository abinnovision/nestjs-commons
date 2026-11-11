import { TASK_MARKER } from "./types.js";
import { EventPayloadMalformedException } from "../../exceptions/index.js";
import {
	createHostRunForContext,
	createHostRunForDurableContext,
} from "../host-run/adapter-factory.js";

import type {
	BaseCtx,
	DurableCtxMembers,
	DurableTaskCtx,
	DurableWorkflowCtx,
	HostTriggerConfig,
	TaskCtx,
	TriggerSource,
	WaitForEventOpts,
	WorkflowCtx,
} from "./types.js";
import type { AnyEventDefinition, EventOutput } from "../../events/index.js";
import type { AnyTaskFn, OutputOfTaskFn } from "../../references/shared.js";
import type { DurableContext } from "@hatchet-dev/typescript-sdk";

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
 * Arguments for durable context factory functions.
 */
type CreateDurableCtxArgs<I> = Omit<CreateCtxArgs<I>, "fromSDK"> & {
	fromSDK: DurableContext<I>;
};

/**
 * Creates the durable members bound to the SDK durable context.
 */
const createDurableMembers = (
	fromSDK: DurableContext<any, any>,
): DurableCtxMembers => {
	const waitForEvent = async (
		event: string | AnyEventDefinition,
		opts?: WaitForEventOpts,
	): Promise<unknown> => {
		const key = typeof event === "string" ? event : event.name;
		const payload = await fromSDK.waitForEvent(
			key,
			opts?.expression,
			undefined,
			opts?.scope,
			opts?.lookbackWindow,
			opts?.label,
		);

		if (typeof event === "string") {
			return payload;
		}

		const result = await event.schema["~standard"].validate(payload);
		if (result.issues) {
			throw new EventPayloadMalformedException(event.name, result.issues);
		}

		return result.value;
	};

	return {
		invocationCount: fromSDK.invocationCount,
		isReplay: fromSDK.invocationCount > 1,
		sleepFor: fromSDK.sleepFor.bind(fromSDK),
		sleepUntil: fromSDK.sleepUntil.bind(fromSDK),
		waitFor: fromSDK.waitFor.bind(fromSDK),
		now: fromSDK.now.bind(fromSDK),
		waitForEvent: waitForEvent as DurableCtxMembers["waitForEvent"],
	};
};

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

/**
 * Creates a DurableTaskCtx from SDK DurableContext for durable standalone task execution.
 *
 * @param args The arguments for creating the durable task context.
 */
export const createDurableTaskCtx = <I>(
	args: CreateDurableCtxArgs<I>,
): DurableTaskCtx<any> => ({
	...createTaskCtx(args),
	...createDurableMembers(args.fromSDK),
	fromSDK: args.fromSDK,
	run: createHostRunForDurableContext(args.fromSDK),
});

/**
 * Creates a DurableWorkflowCtx from SDK DurableContext for durable workflow task execution.
 *
 * @param args The arguments for creating the durable workflow context.
 */
export const createDurableWorkflowCtx = <I>(
	args: CreateDurableCtxArgs<I>,
): DurableWorkflowCtx<any> => ({
	...createWorkflowCtx(args),
	...createDurableMembers(args.fromSDK),
	fromSDK: args.fromSDK,
	run: createHostRunForDurableContext(args.fromSDK),
});

/**
 * Returns true if the context belongs to a durable task.
 *
 * @param ctx The context to check.
 */
export const isDurableCtx = <C extends BaseCtx<any>>(
	ctx: C,
): ctx is C & DurableCtxMembers => "invocationCount" in ctx;
