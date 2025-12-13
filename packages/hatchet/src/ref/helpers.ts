import { METADATA_KEY_HOST_OPTS, METADATA_KEY_TASK_OPTS } from "../internal";

import type { WorkflowCtx } from "../context";
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
 * Finds the single task method in a TaskHost class by looking for @Task() metadata.
 */
function findTaskMethod(host: TaskHostCtor<any>): string {
	const proto = host.prototype;
	const methods = Object.getOwnPropertyNames(proto).filter(
		(name) => name !== "constructor" && typeof proto[name] === "function",
	);

	const taskMethods = methods.filter((method) => {
		const metadata = Reflect.getMetadata(METADATA_KEY_TASK_OPTS, proto[method]);
		return metadata !== undefined;
	});

	return taskMethods[0]!;
}

/**
 * Creates a reference to a task within a {@link TaskHost}.
 * The task method is automatically resolved since a TaskHost has exactly one task.
 * Compile-time validation ensures the host has exactly one task method.
 */
export function taskRef<C extends TaskHostCtor<any>>(
	host: ValidTaskHost<C>,
): TaskRef<C, TaskInput<C>, TaskOutput<C>> {
	return defineRef({
		host,
		method: findTaskMethod(host as C) as TaskMethodKey<C>,
	});
}

/**
 * Creates a reference to a workflow as a {@link WorkflowHost}.
 * Compile-time validation ensures the host has at least one workflow task method.
 */
export function workflowRef<C extends WorkflowHostCtor<any>>(
	host: ValidWorkflowHost<C>,
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
