import { METADATA_KEY_DURABLE, METADATA_KEY_TASK_OPTS } from "../keys.js";

import type { DurableCtxMembers } from "../../execution/index.js";
import type {
	CreateBaseWorkflowOpts,
	CreateDurableTaskWorkflowOpts,
} from "@hatchet-dev/typescript-sdk";

export type DurableTaskOpts = Omit<
	CreateDurableTaskWorkflowOpts,
	"fn" | "name" | keyof CreateBaseWorkflowOpts
>;

/**
 * Decorator to mark a method as a durable Hatchet task.
 * The method must take a `DurableTaskCtx` parameter.
 */
export function DurableTask(opts: DurableTaskOpts) {
	return <F extends (ctx: any) => any>(
		_target: object,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<F> &
			(Parameters<F>[0] extends DurableCtxMembers
				? unknown
				: { error: "@DurableTask() requires a DurableTaskCtx parameter" }),
	): void => {
		Reflect.defineMetadata(
			METADATA_KEY_TASK_OPTS,
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
