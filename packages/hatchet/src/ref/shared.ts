import type { TaskHost, WorkflowHost } from "../abstracts";
import type { BaseCtx } from "../context";

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
		? CI extends C
			? CI extends BaseCtx<any>
				? true
				: false
			: false
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
