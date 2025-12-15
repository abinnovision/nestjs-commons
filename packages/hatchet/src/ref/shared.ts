import type { TaskHost, WorkflowHost } from "../abstracts";
import type { BaseCtx, TaskMarker } from "../context/context";

// --- Internal Utilities ---

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

// --- Base Types ---

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
 *
 * @template I - The input type that the workflow accepts.
 */
export type WorkflowHostCtor<I> = abstract new (
	...args: any[]
) => WorkflowHost<I>;

/**
 * Represents a task host constructor type.
 *
 * @template I - The input type that the task accepts.
 */
export type TaskHostCtor<I> = abstract new (...args: any[]) => TaskHost<I>;

// --- Signature Detection ---

/**
 * Checks if a function signature is a "runnable" task method.
 *
 * A method is considered runnable if its first parameter is a context type
 * that includes the TaskMarker brand. This distinguishes actual task methods
 * (decorated with `@Task()` or `@WorkflowTask()`) from helper methods that
 * use `HelperCtx` which lacks the marker.
 *
 * @template F - The function type to check.
 * @template C - The expected context type (defaults to any BaseCtx).
 * @returns `true` if F is a task method, `false` otherwise.
 */
export type IsTaskRunnableSignature<
	F extends (...args: any[]) => any,
	C extends BaseCtx<any> = any,
> = F extends (...args: any[]) => any
	? Parameters<F> extends [infer CI, ...any[]]
		? CI extends { [K in TaskMarker]: true }
			? CI extends C
				? true
				: false
			: false
		: false
	: false;

/**
 * Extracts method keys from a host that are "runnable" task methods.
 *
 * Uses {@link IsTaskRunnableSignature} to filter only methods whose first
 * parameter has the TaskMarker brand (i.e., uses `TaskCtx` or `WorkflowCtx`).
 *
 * For a TaskHost, this should return exactly one key.
 * For a WorkflowHost, this returns all workflow task method keys.
 *
 * @template T - The host instance type.
 * @template C - Optional context type constraint.
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

// --- Type Extraction ---

/**
 * Extracts the output (return) type of a specific task method.
 *
 * @template T - The host constructor type.
 * @template M - The method key (must be a valid task method key).
 * @returns The awaited return type of the method.
 */
export type AnyTaskOutput<
	T extends AnyHostCtor,
	M extends ContextMethodKeys<InstanceType<T>>,
> = InstanceType<T>[M] extends (...args: any) => any
	? Awaited<ReturnType<InstanceType<T>[M]>>
	: never;

/**
 * Represents any task function signature.
 *
 * A task function takes a context as its first parameter and returns
 * a value (sync or async).
 *
 * @template C - The context type.
 * @template O - The output type.
 */
export type AnyTaskFn<C extends BaseCtx<any>, O> = (ctx: C) => Promise<O> | O;

/**
 * Extracts the output type from a task function, but only if it's a valid
 * task method (has TaskMarker in its context parameter).
 *
 * Returns `never` for helper methods that use `HelperCtx`.
 * This is used by the `parent()` method in workflows to get type-safe
 * access to parent task outputs.
 *
 * @template T - The task function type.
 */
export type OutputOfTaskFn<T extends AnyTaskFn<any, any>> =
	IsTaskRunnableSignature<T> extends true ? Awaited<ReturnType<T>> : never;

/**
 * Extracts the single task method key from a TaskHost.
 * Since a TaskHost must have exactly one task method, this resolves to that method's key.
 *
 * @template T - The task host constructor type.
 */
export type TaskMethodKey<T extends TaskHostCtor<any>> = ContextMethodKeys<
	InstanceType<T>,
	BaseCtx<any>
>;

/**
 * Extracts the input type from a TaskHost.
 *
 * @template T - The task host constructor type.
 */
export type TaskInput<T extends TaskHostCtor<any>> =
	InstanceType<T> extends TaskHost<infer I> ? I : never;

/**
 * Extracts the output type from the single task method of a TaskHost.
 *
 * @template T - The task host constructor type.
 */
export type TaskOutput<T extends TaskHostCtor<any>> = AnyTaskOutput<
	T,
	TaskMethodKey<T>
>;

/**
 * Extracts the input type from a WorkflowHost constructor.
 *
 * @template T - The workflow host constructor type.
 */
export type WorkflowInput<T extends WorkflowHostCtor<any>> =
	InstanceType<T> extends WorkflowHost<infer I> ? I : never;

/**
 * Maps each workflow task method to its output type.
 *
 * @template C - The workflow host instance type.
 * @example
 * ```ts
 * // For a workflow with step1() returning { a: string } and step2() returning { b: number }
 * type Output = WorkflowTasksOutputMap<MyWorkflow>;
 * // Result: { step1: { a: string }; step2: { b: number } }
 * ```
 */
export type WorkflowTasksOutputMap<C extends WorkflowHost<any>> = {
	[K in ContextMethodKeys<C>]: C[K] extends (...a: any[]) => infer R
		? Awaited<R>
		: never;
};

/**
 * Extracts the complete output type of a workflow (map of all task outputs).
 *
 * @template T - The workflow host constructor type.
 */
export type WorkflowOutput<T extends WorkflowHostCtor<any>> =
	WorkflowTasksOutputMap<InstanceType<T>>;

// --- Validation Types ---

/**
 * Error type for invalid TaskHost - shows as a readable string literal in error messages.
 *
 * @template Reason - The error message to display.
 */
export type InvalidTaskHost<Reason extends string> = `Error: ${Reason}`;

/**
 * Error type for invalid WorkflowHost - shows as a readable string literal in error messages.
 *
 * @template Reason - The error message to display.
 */
export type InvalidWorkflowHost<Reason extends string> = `Error: ${Reason}`;

/**
 * Validates that a TaskHost has exactly one task method.
 * Returns the host type if valid, or an error type with a descriptive message.
 *
 * Used by {@link taskRef} to provide compile-time validation.
 *
 * @template C - The task host constructor type to validate.
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
 *
 * Used by {@link workflowRef} to provide compile-time validation.
 *
 * @template C - The workflow host constructor type to validate.
 */
export type ValidWorkflowHost<C extends WorkflowHostCtor<any>> =
	ContextMethodKeys<InstanceType<C>, BaseCtx<any>> extends infer K
		? [K] extends [never]
			? InvalidWorkflowHost<"WorkflowHost must have at least one method with WorkflowCtx parameter">
			: C
		: never;
