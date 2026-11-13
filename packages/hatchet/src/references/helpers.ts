import { fromCtor } from "../metadata/accessor.js";

import type { AnyCallableRef, TaskRef, WorkflowRef } from "./refs.js";
import type {
	AnyHostCtor,
	TaskHostCtor,
	TaskMethodKey,
	ValidTaskHost,
	ValidWorkflowHost,
	WorkflowHostCtor,
} from "./shared.js";

/**
 * Creates a reference to a task within a {@link TaskHost}.
 * The task method is automatically resolved since a TaskHost has exactly one task.
 * Compile-time validation ensures the host has exactly one task method.
 *
 * @deprecated Pass the host class directly, e.g. `client.run(MyTask, input)`.
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
 *
 * @deprecated Pass the host class directly, e.g. `client.run(MyWorkflow, input)`.
 */
export function workflowRef<C extends WorkflowHostCtor<any>>(
	host: ValidWorkflowHost<C>,
): WorkflowRef<C> {
	return { host } satisfies WorkflowRef<C>;
}

/**
 * Normalizes a host constructor or a callable reference to the host constructor.
 */
export function toHostCtor(target: AnyHostCtor | AnyCallableRef): AnyHostCtor {
	return typeof target === "function" ? target : (target.host as AnyHostCtor);
}
