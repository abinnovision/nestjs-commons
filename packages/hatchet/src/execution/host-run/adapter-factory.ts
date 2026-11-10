import { chainWithOptions } from "../../interceptor/chain.js";
import { getRefAccessor } from "../../references/helpers.js";

import type { HostRunFn, HostRunOpts, HostRunReturn } from "./function-type.js";
import type { ClientInterceptor, RunCtx } from "../../interceptor/index.js";
import type { AnyCallableRef, InputOfRef } from "../../references/index.js";
import type { WorkflowRunRef } from "../../sdk/types.js";
import type { Context, HatchetClient } from "@hatchet-dev/typescript-sdk";

/**
 * Run ref including the SDK's internal standalone task name.
 */
type SdkWorkflowRunRef = WorkflowRunRef<unknown> & {
	_standaloneTaskName?: string | undefined;
};

/**
 * Strategy for running a workflow, with a bulk variant for array input.
 */
interface Runner {
	one: (
		workflowName: string,
		input: unknown,
		options: HostRunOpts<boolean> | undefined,
	) => Promise<SdkWorkflowRunRef>;
	many: (
		workflowName: string,
		inputs: unknown[],
		options: HostRunOpts<boolean> | undefined,
	) => Promise<SdkWorkflowRunRef[]>;
}

/**
 * Creates a HostRunFn using the provided runner strategy.
 * This is the shared implementation for both context and admin runners.
 */
function createHostRunFn(
	runner: Runner,
	getInterceptors?: () => ClientInterceptor[],
): HostRunFn {
	return async <
		R extends AnyCallableRef,
		I extends InputOfRef<R> | InputOfRef<R>[],
		W extends boolean = true,
	>(
		ref: R,
		input: I,
		options?: HostRunOpts<W>,
	): Promise<HostRunReturn<I, R, W>> => {
		const accessor = getRefAccessor(ref);
		const workflowName = accessor.name;
		const wait = options?.wait ?? true;

		const execute = async (finalOptions: HostRunOpts<boolean> | undefined) => {
			// The SDK only unwraps a standalone task's output if the run ref has its name.
			const tag = (runRef: SdkWorkflowRunRef) => {
				if (accessor.isTask) {
					runRef._standaloneTaskName = workflowName;
				}

				return runRef;
			};

			if (Array.isArray(input)) {
				const inputs: unknown[] = input;
				if (inputs.length === 0) {
					return [];
				}

				const runRefs = (
					await runner.many(workflowName, inputs, finalOptions)
				).map(tag);

				return wait ? await Promise.all(runRefs.map((r) => r.output)) : runRefs;
			}

			const runRef = tag(await runner.one(workflowName, input, finalOptions));

			return wait ? await runRef.output : runRef;
		};

		const ctx: RunCtx = { ref, name: workflowName, input, options };
		const layers = (getInterceptors?.() ?? []).flatMap((i) =>
			i.interceptRun ? [i.interceptRun.bind(i)] : [],
		);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return (await chainWithOptions(ctx, layers, execute)) as any;
	};
}

/**
 * Creates a HostRunFn that uses SDK Context for spawning child workflows.
 * Used within task execution contexts.
 */
export function createHostRunForContext(ctx: Context<any, any>): HostRunFn {
	// The SDK takes the child key from `key` and overwrites `childKey`.
	const toChildOpts = (options: HostRunOpts<boolean> | undefined) =>
		options?.childKey === undefined
			? options
			: { ...options, key: options.childKey };

	return createHostRunFn({
		one: (workflowName, input, options) =>
			ctx.runNoWaitChild(workflowName, input as any, toChildOpts(options)),
		many: (workflowName, inputs, options) =>
			ctx.bulkRunNoWaitChildren(
				inputs.map((input) => ({
					workflow: workflowName,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					input: input as any,
					options: toChildOpts(options) ?? {},
				})),
			),
	});
}

/**
 * Creates a HostRunFn that uses HatchetClient for external workflow triggering.
 * Used by HClient for triggering workflows from outside task contexts.
 */
export function createHostRunForAdmin(
	client: HatchetClient,
	getInterceptors?: () => ClientInterceptor[],
): HostRunFn {
	return createHostRunFn(
		{
			one: (workflowName, input, options) =>
				client.runNoWait(workflowName, input as any, options ?? {}),
			// The SDK's own bulk trigger path, batched by count and message size.
			many: (workflowName, inputs, options) =>
				client.admin.runWorkflows(
					inputs.map((input) => ({
						workflowName,
						input,
						options: options ?? {},
					})),
				),
		},
		getInterceptors,
	);
}
