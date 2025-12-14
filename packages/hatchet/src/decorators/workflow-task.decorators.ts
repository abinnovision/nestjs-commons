import { METADATA_KEY_WORKFLOW_TASK_OPTS as METADATA_KEY } from "../internal";

import type { WorkflowCtx } from "../context";
import type { ContextMethodKeys, WorkflowHostCtor } from "../ref";
import type { CreateWorkflowTaskOpts } from "@hatchet-dev/typescript-sdk/v1/task";

export type WorkflowTaskOpts<C extends WorkflowHostCtor<any>> = Omit<
	CreateWorkflowTaskOpts,
	"fn" | "parents" | "name"
> & {
	parents?: ContextMethodKeys<InstanceType<C>, WorkflowCtx<any>>[];
};

/**
 * Decorator to mark a method as a workflow task.
 */
export function WorkflowTask<C extends WorkflowHostCtor<any>>(
	opts: WorkflowTaskOpts<C>,
): MethodDecorator {
	return (_target, _propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		Reflect.defineMetadata(METADATA_KEY, opts, descriptor.value);

		return descriptor;
	};
}
