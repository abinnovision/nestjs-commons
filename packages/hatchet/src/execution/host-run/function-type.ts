import type {
	AnyCallableRef,
	InputOfRef,
	OutputOfRef,
	TaskRef,
	WorkflowRef,
} from "../../references/refs.js";
import type {
	TaskHostCtor,
	TaskInput,
	WorkflowHostCtor,
	WorkflowInput,
} from "../../references/shared.js";
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
 * Runs a task or workflow by its host class. Pass an array of inputs to run
 * multiple instances in parallel.
 * If `wait` is set to `false`, a `WorkflowRunRef` is returned.
 */
export interface HostRunFn {
	<
		C extends TaskHostCtor<any>,
		I extends TaskInput<C> | TaskInput<C>[],
		W extends boolean = true,
	>(
		host: C,
		input: I,
		options?: HostRunOpts<W>,
	): Promise<HostRunReturn<I, TaskRef<C>, W>>;

	<
		C extends WorkflowHostCtor<any>,
		I extends WorkflowInput<C> | WorkflowInput<C>[],
		W extends boolean = true,
	>(
		host: C,
		input: I,
		options?: HostRunOpts<W>,
	): Promise<HostRunReturn<I, WorkflowRef<C>, W>>;

	/**
	 * @deprecated Pass the host class directly, e.g. `run(MyTask, input)`.
	 */
	<
		R extends AnyCallableRef,
		I extends InputOfRef<R> | InputOfRef<R>[],
		W extends boolean = true,
	>(
		ref: R,
		input: I,
		options?: HostRunOpts<W>,
	): Promise<HostRunReturn<I, R, W>>;
}
