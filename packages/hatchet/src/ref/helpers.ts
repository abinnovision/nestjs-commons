import { fromCtor } from "../accessor";

import type { AnyCallableRef, TaskRef, WorkflowRef } from "./refs";
import type {
	AnyHostCtor,
	TaskHostCtor,
	TaskInput,
	TaskMethodKey,
	TaskOutput,
	ValidTaskHost,
	ValidWorkflowHost,
	WorkflowHostCtor,
	WorkflowInput,
	WorkflowOutput,
} from "./shared";

/**
 * Defines the "*Ref" types. This takes any input and adds the __types property.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const defineRef = <R>(target: any): R => {
	Object.defineProperty(target, "__types", {
		enumerable: false,
		get: () => {
			throw new Error("Cannot access __types in runtime");
		},
	});

	return Object.freeze(target) as unknown as R;
};

/**
 * Creates a reference to a task within a {@link TaskHost}.
 * The task method is automatically resolved since a TaskHost has exactly one task.
 * Compile-time validation ensures the host has exactly one task method.
 */
export function taskRef<C extends TaskHostCtor<any>>(
	host: ValidTaskHost<C>,
): TaskRef<C, TaskInput<C>, TaskOutput<C>> {
	const accessor = fromCtor(host as C);

	return defineRef<TaskRef<C, TaskInput<C>, TaskOutput<C>>>({
		host,
		method: accessor.methods[0] as TaskMethodKey<C>,
	});
}

/**
 * Creates a reference to a workflow as a {@link WorkflowHost}.
 * Compile-time validation ensures the host has at least one workflow task method.
 */
export function workflowRef<C extends WorkflowHostCtor<any>>(
	host: ValidWorkflowHost<C>,
): WorkflowRef<C, WorkflowInput<C>, WorkflowOutput<C>> {
	return defineRef<WorkflowRef<C, WorkflowInput<C>, WorkflowOutput<C>>>({
		host,
	});
}

/**
 * Gets the HostAccessor from a callable reference.
 */
export function getRefAccessor(ref: AnyCallableRef) {
	return fromCtor(ref.host as AnyHostCtor);
}
