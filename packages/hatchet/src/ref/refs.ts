import type {
	ContextMethodKeys,
	TaskHostCtor,
	WorkflowHostCtor,
} from "./shared";

/**
 * Reference to a task within a {@link TaskHost}
 */
export interface TaskRef<C extends TaskHostCtor<any>, I, O> {
	readonly host: C;
	readonly method: ContextMethodKeys<InstanceType<C>>;

	readonly __types: {
		input: I;
		output: O;
	};
}

/**
 * Reference to a workflow as a {@link WorkflowHost}
 */
export interface WorkflowRef<C extends WorkflowHostCtor<any>, I, O> {
	readonly host: C;

	readonly __types: {
		input: I;
		output: O;
	};
}

/**
 * Reference to a task within a {@link WorkflowHost}, without the knowledge of the {@link WorkflowHost} itself.
 */
export interface WorkflowTaskRef<I, O> {
	readonly method: string;

	readonly __types: {
		input: I;
		output: O;
	};
}

/**
 * Represents any callable reference.
 * Note that externally only TaskRef and WorkflowRef are supported.
 */
export type AnyCallableRef =
	| TaskRef<any, any, any>
	| WorkflowRef<any, any, any>;

/**
 * Extracts the input type of the callable reference.
 */
export type InputOfRef<R extends AnyCallableRef> =
	R extends TaskRef<any, infer I, any>
		? I
		: R extends WorkflowRef<any, infer I, any>
			? I
			: never;

/**
 * Extracts the output type of the callable reference.
 */
export type OutputOfRef<R extends AnyCallableRef> =
	R extends TaskRef<any, any, infer O>
		? O
		: R extends WorkflowRef<any, any, infer O>
			? O
			: never;
