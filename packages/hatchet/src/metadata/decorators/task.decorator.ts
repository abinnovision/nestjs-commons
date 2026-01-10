import { METADATA_KEY_TASK_OPTS as METADATA_KEY } from "../keys";

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
export const Task = (opts: TaskOpts): MethodDecorator => {
	return (_target, _propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		Reflect.defineMetadata(METADATA_KEY, opts, descriptor.value);

		return descriptor;
	};
};
