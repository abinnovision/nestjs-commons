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

	if (taskMethods.length === 0) {
		throw new Error(
			`TaskHost '${host.name}' must have exactly one method decorated with @Task()`,
		);
	}

	if (taskMethods.length > 1) {
		throw new Error(
			`TaskHost '${host.name}' has multiple @Task() methods. Only one is allowed.`,
		);
	}

	return taskMethods[0]!;
}

/**
 * Creates a reference to a task within a {@link TaskHost}.
 * The task method is automatically resolved since a TaskHost has exactly one task.
 */
export function taskRef<C extends TaskHostCtor<any>>(
	host: C,
): TaskRef<C, TaskInput<C>, TaskOutput<C>> {
	const method = findTaskMethod(host) as TaskMethodKey<C>;
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
