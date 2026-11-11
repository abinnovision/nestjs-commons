import {
	METADATA_KEY_DURABLE,
	METADATA_KEY_WORKFLOW_TASK_OPTS,
} from "../keys.js";

import type { DurableCtxMembers, WorkflowCtx } from "../../execution/index.js";
import type {
	ContextMethodKeys,
	WorkflowHostCtor,
} from "../../references/shared.js";
import type { CreateWorkflowDurableTaskOpts } from "@hatchet-dev/typescript-sdk";

export type DurableWorkflowTaskOpts<C extends WorkflowHostCtor<any>> = Omit<
	CreateWorkflowDurableTaskOpts,
	"fn" | "parents" | "name"
> & {
	parents?: ContextMethodKeys<InstanceType<C>, WorkflowCtx<any>>[];
};

/**
 * Decorator to mark a method as a durable workflow task.
 * The method must take a `DurableWorkflowCtx` parameter.
 */
export function DurableWorkflowTask<C extends WorkflowHostCtor<any>>(
	opts: DurableWorkflowTaskOpts<C>,
) {
	return <F extends (ctx: any) => any>(
		_target: object,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<F> &
			(Parameters<F>[0] extends DurableCtxMembers
				? unknown
				: {
						error: "@DurableWorkflowTask() requires a DurableWorkflowCtx parameter";
					}),
	): void => {
		Reflect.defineMetadata(
			METADATA_KEY_WORKFLOW_TASK_OPTS,
			opts,
			descriptor.value as object,
		);
		Reflect.defineMetadata(
			METADATA_KEY_DURABLE,
			true,
			descriptor.value as object,
		);
	};
}
