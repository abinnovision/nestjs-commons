import { METADATA_KEY_WORKFLOW_TASK_OPTS as METADATA_KEY } from "../keys.js";

import type { DurableCtxMembers, WorkflowCtx } from "../../execution/index.js";
import type {
	ContextMethodKeys,
	WorkflowHostCtor,
} from "../../references/shared.js";
import type { CreateWorkflowTaskOpts } from "@hatchet-dev/typescript-sdk";

export type WorkflowTaskOpts<C extends WorkflowHostCtor<any>> = Omit<
	CreateWorkflowTaskOpts,
	"fn" | "parents" | "name"
> & {
	parents?: ContextMethodKeys<InstanceType<C>, WorkflowCtx<any>>[];
};

/**
 * Decorator to mark a method as a workflow task.
 * Methods taking a `DurableWorkflowCtx` must use `@DurableWorkflowTask()` instead.
 */
export function WorkflowTask<C extends WorkflowHostCtor<any>>(
	opts: WorkflowTaskOpts<C>,
) {
	return <F extends (...args: any[]) => any>(
		_target: object,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<F> &
			(Parameters<F>[0] extends DurableCtxMembers
				? {
						error: "A DurableWorkflowCtx parameter requires @DurableWorkflowTask()";
					}
				: unknown),
	): void => {
		Reflect.defineMetadata(METADATA_KEY, opts, descriptor.value as object);
	};
}
