import type { TaskHost, WorkflowHost } from "../abstracts";
import type { BaseCtx, TaskMarker } from "../context/context";

/**
 * Converts a union to an intersection. Used for detecting if a type is a union.
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;

/**
 * Checks if a type is a union (more than one member).
 */
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

/**
 * Represents any host instance type.
 */
export type AnyHost = WorkflowHost<any> | TaskHost<any>;

/**
 * Represents any host constructor type.
 */
export type AnyHostCtor = WorkflowHostCtor<any> | TaskHostCtor<any>;

/**
 * Represents a workflow host constructor type.
 */
export type WorkflowHostCtor<I> = abstract new (
	...args: any[]
) => WorkflowHost<I>;

/**
 * Represents a task host constructor type.
 */
export type TaskHostCtor<I> = abstract new (...args: any[]) => TaskHost<I>;

export type IsTaskRunnableSignature<
	F extends (...args: any[]) => any,
	C extends BaseCtx<any> = any,
> = F extends (...args: any[]) => any
	? Parameters<F> extends [infer CI, ...any[]]
		? CI extends { [K in TaskMarker]: true }
			? CI extends C
				? true // Has task marker and extends context - is a task method
				: false
			: false // No task marker - not a task method (e.g., HelperCtx)
		: false
	: false;

/**
 * Extracts the keys of any host that matches the "task"-runnable signature.
 */
export type ContextMethodKeys<
	T extends AnyHost,
	C extends BaseCtx<any> = any,
> = {
	[K in keyof T]: T[K] extends (...args: any) => any
		? IsTaskRunnableSignature<T[K], C> extends true
			? K
			: never
		: never;
}[keyof T];

/**
 * Extracts the input type of a method of a class which takes a context as the first argument.
 */
export type AnyTaskInput<
	T extends AnyHostCtor,
	M extends ContextMethodKeys<InstanceType<T>, any>,
> = InstanceType<T>[M] extends (...args: any) => any
	? Parameters<InstanceType<T>[M]> extends [BaseCtx<infer I>, ...any[]]
		? I
		: never
	: never;

/**
 * Extracts the output type of a method of a class which takes a context as the first argument.
 */
export type AnyTaskOutput<
	T extends AnyHostCtor,
	M extends ContextMethodKeys<InstanceType<T>, any>,
> = InstanceType<T>[M] extends (...args: any) => any
	? Awaited<ReturnType<InstanceType<T>[M]>>
	: never;

/**
 * Extracts the input type of a workflow host.
 */
export type WorkflowInput<T extends WorkflowHostCtor<any>> =
	InstanceType<T> extends WorkflowHost<infer I> ? I : never;

/**
 * Extracts the output types of all the methods of a workflow host.
 */
export type WorkflowTasksOutputMap<C extends WorkflowHost<any>> = {
	[K in ContextMethodKeys<C>]: C[K] extends (...a: any[]) => infer R
		? Awaited<R>
		: never;
};

/**
 * Extracts the output type of a workflow host.
 */
export type WorkflowOutput<T extends WorkflowHostCtor<any>> =
	WorkflowTasksOutputMap<InstanceType<T>>;

export type AnyTaskFn<C extends BaseCtx<any>, O> = (ctx: C) => Promise<O> | O;

export type OutputOfTaskFn<T extends AnyTaskFn<any, any>> =
	IsTaskRunnableSignature<T> extends true ? Awaited<ReturnType<T>> : never;

/**
 * Error type for invalid TaskHost - shows as a readable string literal in error messages.
 */
export type InvalidTaskHost<Reason extends string> = `Error: ${Reason}`;

/**
 * Error type for invalid WorkflowHost - shows as a readable string literal in error messages.
 */
export type InvalidWorkflowHost<Reason extends string> = `Error: ${Reason}`;

/**
 * Validates that a TaskHost has exactly one task method.
 * Returns the host type if valid, or an error type with a descriptive message.
 */
export type ValidTaskHost<C extends TaskHostCtor<any>> =
	ContextMethodKeys<InstanceType<C>, BaseCtx<any>> extends infer K
		? [K] extends [never]
			? InvalidTaskHost<"TaskHost must have exactly one method with TaskCtx parameter">
			: IsUnion<K> extends true
				? InvalidTaskHost<"TaskHost has multiple task methods - only one is allowed">
				: C
		: never;

/**
 * Validates that a WorkflowHost has at least one workflow task method.
 * Returns the host type if valid, or an error type with a descriptive message.
 */
export type ValidWorkflowHost<C extends WorkflowHostCtor<any>> =
	ContextMethodKeys<InstanceType<C>, BaseCtx<any>> extends infer K
		? [K] extends [never]
			? InvalidWorkflowHost<"WorkflowHost must have at least one method with WorkflowCtx parameter">
			: C
		: never;

/**
 * Extracts the single task method key from a TaskHost.
 * Since a TaskHost must have exactly one task method, this resolves to that method's key.
 */
export type TaskMethodKey<T extends TaskHostCtor<any>> = ContextMethodKeys<
	InstanceType<T>,
	BaseCtx<any>
>;

/**
 * Extracts the input type from the single task method of a TaskHost.
 */
export type TaskInput<T extends TaskHostCtor<any>> = AnyTaskInput<
	T,
	TaskMethodKey<T>
>;

/**
 * Extracts the output type from the single task method of a TaskHost.
 */
export type TaskOutput<T extends TaskHostCtor<any>> = AnyTaskOutput<
	T,
	TaskMethodKey<T>
>;
