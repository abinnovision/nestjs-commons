import { getRefAccessor } from "../../ref";

import type { HostRunFn, HostRunOpts, HostRunReturn } from "./function-type";
import type { AnyCallableRef, InputOfRef } from "../../ref";
import type { Context, HatchetClient } from "@hatchet-dev/typescript-sdk";
import type WorkflowRunRef from "@hatchet-dev/typescript-sdk/util/workflow-run-ref";

/**
 * Creates a HostRunFn that uses SDK Context for spawning child workflows.
 * Used within task execution contexts.
 */
export function createHostRunForContext(ctx: Context<any, any>): HostRunFn {
	return async <
		R extends AnyCallableRef,
		I extends InputOfRef<R> | InputOfRef<R>[],
		W extends boolean = true,
	>(
		ref: R,
		input: I,
		options?: HostRunOpts<W>,
	): Promise<HostRunReturn<I, R, W>> => {
		const workflowName = getRefAccessor(ref).name;
		const wait = options?.wait ?? true;

		if (Array.isArray(input)) {
			const results = await Promise.all(
				(input as InputOfRef<R>[]).map((i: InputOfRef<R>) =>
					ctx.runNoWaitChild(workflowName, i as any, options),
				),
			);

			if (wait) {
				// Wait for all results to complete before returning.
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return (await Promise.all(results.map((r) => r.output))) as any;
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return results as any;
		}

		const runRef = await ctx.runNoWaitChild(
			workflowName,
			input as any,
			options,
		);

		if (wait) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return runRef.output as any;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return runRef as any;
	};
}

/**
 * Creates a HostRunFn that uses HatchetClient.admin for external workflow triggering.
 * Used by HClient for triggering workflows from outside task contexts.
 */
export function createHostRunForAdmin(client: HatchetClient): HostRunFn {
	return async <
		R extends AnyCallableRef,
		I extends InputOfRef<R> | InputOfRef<R>[],
		W extends boolean = true,
	>(
		ref: R,
		input: I,
		options?: HostRunOpts<W>,
	): Promise<HostRunReturn<I, R, W>> => {
		const workflowName = getRefAccessor(ref).name;
		const wait = options?.wait ?? true;

		if (Array.isArray(input)) {
			const results = await Promise.all<WorkflowRunRef<any>>(
				(input as InputOfRef<R>[]).map((i: InputOfRef<R>) =>
					client.runNoWait(workflowName, i as any, options ?? {}),
				),
			);

			if (wait) {
				// Wait for all results to complete before returning.
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return (await Promise.all(results.map((r) => r.output))) as any;
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return results as any;
		}

		const runRef = await client.runNoWait(
			workflowName,
			input as any,
			options ?? {},
		);

		if (wait) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return runRef.output as any;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return runRef as any;
	};
}
