import { METADATA_KEY_WORKFLOW_TASK_OPTS } from "../internal";

import type { CtxWorkflow } from "../context";
import type { ContextMethodKeys, WorkflowHostCtor } from "../ref";
import type { CreateWorkflowTaskOpts } from "@hatchet-dev/typescript-sdk/v1/task";

export type WorkflowTaskOpts<C extends WorkflowHostCtor<any>> = Omit<
	CreateWorkflowTaskOpts,
	"fn" | "parents" | "name"
> & {
	parents?: ContextMethodKeys<InstanceType<C>, CtxWorkflow<any>>[];
};

/**
 * Decorator to mark a method as a workflow task.
 */
export function WorkflowTask<C extends WorkflowHostCtor<any>>(
	_opts: WorkflowTaskOpts<C>,
): MethodDecorator {
	return (
		_target: any,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<any>,
	) => {
		Reflect.defineMetadata(
			METADATA_KEY_WORKFLOW_TASK_OPTS,
			_opts,
			descriptor.value,
		);
		return descriptor;
	};
}
