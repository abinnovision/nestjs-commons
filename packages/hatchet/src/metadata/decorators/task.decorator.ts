import { METADATA_KEY_TASK_OPTS as METADATA_KEY } from "../keys.js";

import type { DurableCtxMembers } from "../../execution/index.js";
import type {
	CreateBaseWorkflowOpts,
	CreateTaskWorkflowOpts,
} from "@hatchet-dev/typescript-sdk";

export type TaskOpts = Omit<
	CreateTaskWorkflowOpts,
	"fn" | "name" | keyof CreateBaseWorkflowOpts
>;

/**
 * Decorator to mark a method as a Hatchet task.
 * Methods taking a `DurableTaskCtx` must use `@DurableTask()` instead.
 */
export const Task = (opts: TaskOpts) => {
	return <F extends (...args: any[]) => any>(
		_target: object,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<F> &
			(Parameters<F>[0] extends DurableCtxMembers
				? { error: "A DurableTaskCtx parameter requires @DurableTask()" }
				: unknown),
	): void => {
		Reflect.defineMetadata(METADATA_KEY, opts, descriptor.value as object);
	};
};
