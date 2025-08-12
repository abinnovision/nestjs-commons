import type { CtxTask, CtxWorkflow } from "../context";
import type { TaskRef, WorkflowRef, WorkflowTaskRef } from "./refs";
import type {
	AnyTaskInput,
	AnyTaskOutput,
	ContextMethodKeys,
	TaskHostCtor,
	WorkflowHostCtor,
	WorkflowInput,
	WorkflowOutput,
} from "./shared";

/**
 * Defines the "*Ref" types.
 */
const defineRef = (target: object): any => {
	Object.defineProperty(target, "__types", {
		enumerable: false,
		value: null,
		get: () => {
			throw new Error("Cannot access __types in runtime");
		},
	});

	return Object.freeze(target);
};

/**
 * Creates a reference to a task within a {@link TaskHost}.
 */
export function taskRef<
	C extends TaskHostCtor<any>,
	M extends ContextMethodKeys<InstanceType<C>, CtxTask<any>>,
>(host: C, method: M): TaskRef<C, AnyTaskInput<C, M>, AnyTaskOutput<C, M>> {
	return defineRef({ host, method });
}

/**
 * Creates a reference to a workflow as a {@link WorkflowHost}.
 */
export function workflowRef<C extends WorkflowHostCtor<any>>(
	host: C,
): WorkflowRef<C, WorkflowInput<C>, WorkflowOutput<C>> {
	return defineRef({ host });
}

/**
 * Creates a reference to a task within a {@link WorkflowHost}.
 */
export function workflowTaskRef<
	C extends WorkflowHostCtor<any>,
	M extends ContextMethodKeys<InstanceType<C>, CtxWorkflow<any>>,
>(
	host: C,
	method: M,
): WorkflowTaskRef<AnyTaskInput<C, M>, AnyTaskOutput<C, M>> {
	return defineRef({ host, method });
}
