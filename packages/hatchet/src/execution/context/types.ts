import type { TaskHost, WorkflowHost } from "../../abstracts";
import type { AnyEventDefinition, EventOutput } from "../../events";
import type { AnyTaskFn, OutputOfTaskFn } from "../../references/shared";
import type { HostRunFn } from "../host-run";
import type { Context } from "@hatchet-dev/typescript-sdk";

export const TASK_MARKER = Symbol("TASK_MARKER");
export type TaskMarker = typeof TASK_MARKER;

/**
 * Type representing the source that triggered the task execution.
 *
 * - "run": Triggered with default payload via direct run.
 * - "event": Triggered by an event.
 * - "cron": Triggered by a cron schedule.
 *
 * Note that the detection of trigger source is best-effort and may not be accurate in all cases.
 * Hatchet does not currently provide first-class support for distinguishing all trigger sources.
 */
export type TriggerSource = "run" | "event" | "cron";

/**
 * Configuration extracted from host decorator for trigger introspection.
 */
export interface HostTriggerConfig {
	/**
	 * Event names this host listens to
	 */
	onEvents: string[];

	/**
	 * Cron schedules this host responds to
	 */
	onCrons: string[];
}

/**
 * Type for the context when a task is running. This is universal for standalone and workflow tasks.
 * This partially implements the `Context` type from the SDK.
 *
 * @template I The input type of the task.
 */
export interface BaseCtx<I> {
	/**
	 * Host metadata accessor for introspection.
	 */
	readonly hostConfig: HostTriggerConfig;

	/**
	 * The source that triggered the task execution.
	 */
	triggerSource: TriggerSource;

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

	/**
	 * Returns true if triggered via direct run.
	 * When true, ctx.input is the validated host schema type.
	 */
	isRun: () => this is BaseCtx<I> & { triggerSource: "run" };

	/**
	 * Returns true if triggered via event.
	 * Optionally accepts an EventDefinition to check for a specific event type.
	 *
	 * @param eventDef Optional event definition to check for specific event
	 */
	isEvent: <E extends AnyEventDefinition>(
		eventDef?: E,
	) => this is BaseCtx<I> & {
		triggerSource: "event";
		input: E extends AnyEventDefinition ? EventOutput<E> : unknown;
	};

	/**
	 * Returns true if triggered via cron schedule.
	 * When true, ctx.input is void/empty.
	 */
	isCron: () => this is BaseCtx<I> & { triggerSource: "cron"; input: never };
}

/**
 * Context type of the run of a standalone task.
 * Branded with TASK_MARKER for compile-time task method detection.
 */
export type TaskCtx<T extends TaskHost<any>> = BaseCtx<
	T extends TaskHost<infer I> ? I : never
> & { [TASK_MARKER]: true };

/**
 * Context type of the run of a workflow task.
 * Branded with TASK_MARKER for compile-time task method detection.
 */
export type WorkflowCtx<T extends WorkflowHost<any>> = BaseCtx<
	T extends WorkflowHost<infer I> ? I : never
> & {
	[TASK_MARKER]: true;
	/**
	 * Provides the output of a parent task.
	 */
	parent: <F extends AnyTaskFn<any, any>>(
		method: F,
	) => Promise<OutputOfTaskFn<F>>;
};

/**
 * Context type for helper methods that need access to the task context
 * but should not be counted as task methods.
 * This is essentially BaseCtx with the input type extracted from the host.
 */
export type HelperCtx<T extends TaskHost<any> | WorkflowHost<any>> = BaseCtx<
	T extends TaskHost<infer I> ? I : T extends WorkflowHost<infer I> ? I : never
>;
