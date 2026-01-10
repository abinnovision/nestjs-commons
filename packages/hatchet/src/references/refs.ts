import type {
	ContextMethodKeys,
	TaskHostCtor,
	TaskInput,
	TaskOutput,
	WorkflowHostCtor,
	WorkflowInput,
	WorkflowOutput,
} from "./shared";

/**
 * Reference to a task within a {@link TaskHost}
 */
export interface TaskRef<C extends TaskHostCtor<any>> {
	readonly host: C;
	readonly method: ContextMethodKeys<InstanceType<C>>;
}

/**
 * Reference to a workflow as a {@link WorkflowHost}
 */
export interface WorkflowRef<C extends WorkflowHostCtor<any>> {
	readonly host: C;
}

/**
 * Represents any callable reference.
 * Note that externally only TaskRef and WorkflowRef are supported.
 */
export type AnyCallableRef = TaskRef<any> | WorkflowRef<any>;

/**
 * Extracts the input type of the callable reference.
 */
export type InputOfRef<R extends AnyCallableRef> =
	R extends TaskRef<infer C>
		? TaskInput<C>
		: R extends WorkflowRef<infer C>
			? WorkflowInput<C>
			: never;

/**
 * Extracts the output type of the callable reference.
 */
export type OutputOfRef<R extends AnyCallableRef> =
	R extends TaskRef<infer C>
		? TaskOutput<C>
		: R extends WorkflowRef<infer C>
			? WorkflowOutput<C>
			: never;
