import { getRefAccessor } from "../../references/helpers.js";

import type { HostRunFn, HostRunOpts, HostRunReturn } from "./function-type.js";
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
 * Strategy function for running a workflow.
 */
type RunnerFn = (
	workflowName: string,
	input: unknown,
	options: HostRunOpts<boolean> | undefined,
) => Promise<SdkWorkflowRunRef>;

/**
 * Creates a HostRunFn using the provided runner strategy.
 * This is the shared implementation for both context and admin runners.
 */
function createHostRunFn(runner: RunnerFn): HostRunFn {
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

		// The SDK only unwraps a standalone task's output if the run ref has its name.
		const run = async (i: unknown) => {
			const runRef = await runner(workflowName, i, options);
			if (accessor.isTask) {
				runRef._standaloneTaskName = workflowName;
			}

			return runRef;
		};

		if (Array.isArray(input)) {
			const runs = (input as InputOfRef<R>[]).map((i) => run(i));

			if (wait) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return (await Promise.all(
					runs.map((p) => p.then((r) => r.output)),
				)) as any;
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return (await Promise.all(runs)) as any;
		}

		const runRef = await run(input);

		if (wait) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return runRef.output as any;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return runRef as any;
	};
}

/**
 * Creates a HostRunFn that uses SDK Context for spawning child workflows.
 * Used within task execution contexts.
 */
export function createHostRunForContext(ctx: Context<any, any>): HostRunFn {
	return createHostRunFn((workflowName, input, options) =>
		ctx.runNoWaitChild(
			workflowName,
			input as any,
			// The SDK takes the child key from `key` and overwrites `childKey`.
			options?.childKey === undefined
				? options
				: { ...options, key: options.childKey },
		),
	);
}

/**
 * Creates a HostRunFn that uses HatchetClient for external workflow triggering.
 * Used by HClient for triggering workflows from outside task contexts.
 */
export function createHostRunForAdmin(client: HatchetClient): HostRunFn {
	return createHostRunFn((workflowName, input, options) =>
		client.runNoWait(workflowName, input as any, options ?? {}),
	);
}
