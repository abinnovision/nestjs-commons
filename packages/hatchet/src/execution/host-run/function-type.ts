import type {
	AnyCallableRef,
	InputOfRef,
	OutputOfRef,
} from "../../references/index.js";
import type { WorkflowRunRef } from "../../sdk/types.js";
import type { RunOpts } from "@hatchet-dev/typescript-sdk";

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

/**
 * Options for {@link HostRunFn}.
 * `returnExceptions` is omitted, as array runs always reject on the first failure.
 */
export interface HostRunOpts<W extends boolean> extends Omit<
	RunOpts,
	"returnExceptions"
> {
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
