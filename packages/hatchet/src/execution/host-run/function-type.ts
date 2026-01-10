import type { AnyCallableRef, InputOfRef, OutputOfRef } from "../../references";
import type { RunOpts } from "@hatchet-dev/typescript-sdk";
import type WorkflowRunRef from "@hatchet-dev/typescript-sdk/util/workflow-run-ref";

/**
 * Describes the return type of the {@link HostRunFn} function.
 *
 * @param I The input type of the callable reference.
 * @param R The callable reference.
 * @param W Whether to wait for the task to complete before returning.
 */
export type HostRunReturn<
	I extends InputOfRef<R> | InputOfRef<R>[],
	R extends AnyCallableRef,
	W extends boolean,
> = I extends InputOfRef<R>[]
	? W extends true
		? OutputOfRef<R>[]
		: WorkflowRunRef<OutputOfRef<R>>[]
	: W extends true
		? OutputOfRef<R>
		: WorkflowRunRef<OutputOfRef<R>>;

export interface HostRunOpts<W extends boolean> extends RunOpts {
	/**
	 * Whether to wait for the task to complete before returning.
	 *
	 * @default true
	 */
	wait?: W;
}

/**
 * Runs a child task or workflow. This can be used to run multiple tasks in parallel.
 * If `wait` is set to `false`, a `WorkflowRunRef` is returned.
 */
export type HostRunFn = <
	R extends AnyCallableRef,
	I extends InputOfRef<R> | InputOfRef<R>[],
	W extends boolean = true,
>(
	ref: R,
	input: I,
	options?: HostRunOpts<W>,
) => Promise<HostRunReturn<I, R, W>>;
