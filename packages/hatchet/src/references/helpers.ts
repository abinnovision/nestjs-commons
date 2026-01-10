import { fromCtor } from "../metadata/accessor";

import type { AnyCallableRef, TaskRef, WorkflowRef } from "./refs";
import type {
	AnyHostCtor,
	TaskHostCtor,
	TaskMethodKey,
	ValidTaskHost,
	ValidWorkflowHost,
	WorkflowHostCtor,
} from "./shared";

/**
 * Creates a reference to a task within a {@link TaskHost}.
 * The task method is automatically resolved since a TaskHost has exactly one task.
 * Compile-time validation ensures the host has exactly one task method.
 */
export function taskRef<C extends TaskHostCtor<any>>(
	host: ValidTaskHost<C>,
): TaskRef<C> {
	const accessor = fromCtor(host as C);

	return {
		host,
		method: accessor.methods[0] as TaskMethodKey<C>,
	} satisfies TaskRef<C>;
}

/**
 * Creates a reference to a workflow as a {@link WorkflowHost}.
 * Compile-time validation ensures the host has at least one workflow task method.
 */
export function workflowRef<C extends WorkflowHostCtor<any>>(
	host: ValidWorkflowHost<C>,
): WorkflowRef<C> {
	return { host } satisfies WorkflowRef<C>;
}

/**
 * Gets the HostAccessor from a callable reference.
 */
export function getRefAccessor(ref: AnyCallableRef) {
	return fromCtor(ref.host as AnyHostCtor);
}
