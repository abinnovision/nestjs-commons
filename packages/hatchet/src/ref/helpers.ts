import { METADATA_KEY_HOST_OPTS } from "../internal";

import type { TaskCtx, WorkflowCtx } from "../context";
import type {
	AnyCallableRef,
	TaskRef,
	WorkflowRef,
	WorkflowTaskRef,
} from "./refs";
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
	M extends ContextMethodKeys<InstanceType<C>, TaskCtx<any>>,
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
	M extends ContextMethodKeys<InstanceType<C>, WorkflowCtx<any>>,
>(
	host: C,
	method: M,
): WorkflowTaskRef<AnyTaskInput<C, M>, AnyTaskOutput<C, M>> {
	return defineRef({ host, method });
}

/**
 * Gets the workflow name from a callable reference.
 */
export function getRefWorkflowName(ref: AnyCallableRef): string {
	const hostOpts = Reflect.getMetadata(METADATA_KEY_HOST_OPTS, ref.host);
	return hostOpts.name;
}
