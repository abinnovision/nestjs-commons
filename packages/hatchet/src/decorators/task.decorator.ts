import { METADATA_KEY_TASK_OPTS } from "../internal";

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
 */
export const Task = (_opts: TaskOpts): MethodDecorator => {
	return (
		_target: any,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<any>,
	) => {
		Reflect.defineMetadata(METADATA_KEY_TASK_OPTS, _opts, descriptor.value);
		return descriptor;
	};
};
