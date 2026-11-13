import {
	METADATA_KEY_DURABLE,
	METADATA_KEY_WORKFLOW_TASK_OPTS,
} from "../keys.js";

import type { CtxGuard } from "./ctx-guard.js";
import type { WorkflowCtx } from "../../execution/index.js";
import type {
	ContextMethodKeys,
	WorkflowHostCtor,
} from "../../references/shared.js";
import type {
	CreateWorkflowDurableTaskOpts,
	CreateWorkflowTaskOpts,
} from "@hatchet-dev/typescript-sdk";

type OmittedKeys = "fn" | "parents" | "name";

interface ParentsOpts<C extends WorkflowHostCtor<any>> {
	parents?: ContextMethodKeys<InstanceType<C>, WorkflowCtx<any>>[];
}

export type WorkflowTaskOpts<C extends WorkflowHostCtor<any>> =
	| (Omit<CreateWorkflowTaskOpts, OmittedKeys> &
			ParentsOpts<C> & { durable?: false })
	| (Omit<CreateWorkflowDurableTaskOpts, OmittedKeys> &
			ParentsOpts<C> & { durable: true });

/**
 * Decorator to mark a method as a workflow task.
 * With `durable: true`, the task runs as a durable task and the method must take a `DurableWorkflowCtx`.
 */
export function WorkflowTask<C extends WorkflowHostCtor<any>>(
	opts: Extract<WorkflowTaskOpts<C>, { durable: true }>,
): CtxGuard<true, "durable: true requires a DurableWorkflowCtx parameter">;
export function WorkflowTask<C extends WorkflowHostCtor<any>>(
	opts: Extract<WorkflowTaskOpts<C>, { durable?: false }>,
): CtxGuard<false, "A DurableWorkflowCtx parameter requires durable: true">;
export function WorkflowTask<C extends WorkflowHostCtor<any>>(
	opts: WorkflowTaskOpts<C>,
) {
	return (
		_target: object,
		_propertyKey: string | symbol,
		descriptor: PropertyDescriptor,
	): void => {
		const { durable, ...rest } = opts;

		Reflect.defineMetadata(
			METADATA_KEY_WORKFLOW_TASK_OPTS,
			rest,
			descriptor.value as object,
		);

		if (durable) {
			Reflect.defineMetadata(
				METADATA_KEY_DURABLE,
				true,
				descriptor.value as object,
			);
		}
	};
}
