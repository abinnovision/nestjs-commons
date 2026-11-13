import type {
	AnyCallableRef as InternalAnyCallableRef,
	InputOfRef as InternalInputOfRef,
	OutputOfRef as InternalOutputOfRef,
	TaskRef as InternalTaskRef,
	WorkflowRef as InternalWorkflowRef,
} from "./refs.js";
import type { TaskHostCtor, WorkflowHostCtor } from "./shared.js";

// Reference types

/**
 * Reference to a task within a {@link TaskHost}.
 *
 * @deprecated Pass the host class directly.
 */
export type TaskRef<C extends TaskHostCtor<any>> = InternalTaskRef<C>;

/**
 * Reference to a workflow as a {@link WorkflowHost}.
 *
 * @deprecated Pass the host class directly.
 */
export type WorkflowRef<C extends WorkflowHostCtor<any>> =
	InternalWorkflowRef<C>;

/**
 * Represents any callable reference.
 *
 * @deprecated Pass the host class directly.
 */
export type AnyCallableRef = InternalAnyCallableRef;

/**
 * Extracts the input type of the callable reference.
 *
 * @deprecated Use `TaskInput` or `WorkflowInput` with the host class.
 */
export type InputOfRef<R extends InternalAnyCallableRef> =
	InternalInputOfRef<R>;

/**
 * Extracts the output type of the callable reference.
 *
 * @deprecated Use `TaskOutput` or `WorkflowOutput` with the host class.
 */
export type OutputOfRef<R extends InternalAnyCallableRef> =
	InternalOutputOfRef<R>;

// *Ref functions
// eslint-disable-next-line @typescript-eslint/no-deprecated -- re-exported for backwards compatibility
export { taskRef, workflowRef } from "./helpers.js";

// Type utilities
export type {
	TaskInput,
	TaskOutput,
	WorkflowInput,
	WorkflowOutput,
	WorkflowTasksOutputMap,
} from "./shared.js";
