import { METADATA_KEY_DURABLE, METADATA_KEY_TASK_OPTS } from "../keys.js";

import type { CtxGuard } from "./ctx-guard.js";
import type {
	CreateBaseWorkflowOpts,
	CreateDurableTaskWorkflowOpts,
	CreateTaskWorkflowOpts,
} from "@hatchet-dev/typescript-sdk";

type OmittedKeys = "fn" | "name" | keyof CreateBaseWorkflowOpts;

export type TaskOpts =
	| (Omit<CreateTaskWorkflowOpts, OmittedKeys> & { durable?: false })
	| (Omit<CreateDurableTaskWorkflowOpts, OmittedKeys> & { durable: true });

/**
 * Decorator to mark a method as a Hatchet task.
 * With `durable: true`, the task runs as a durable task and the method must take a `DurableTaskCtx`.
 */
export function Task(
	opts: Extract<TaskOpts, { durable: true }>,
): CtxGuard<true, "durable: true requires a DurableTaskCtx parameter">;
export function Task(
	opts: Extract<TaskOpts, { durable?: false }>,
): CtxGuard<false, "A DurableTaskCtx parameter requires durable: true">;
export function Task(opts: TaskOpts) {
	return (
		_target: object,
		_propertyKey: string | symbol,
		descriptor: PropertyDescriptor,
	): void => {
		const { durable, ...rest } = opts;

		Reflect.defineMetadata(
			METADATA_KEY_TASK_OPTS,
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
