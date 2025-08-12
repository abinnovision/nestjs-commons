import type {
	CreateBaseWorkflowOpts,
	CreateTaskWorkflowOpts,
} from "@hatchet-dev/typescript-sdk";

export type TaskOpts = Omit<
	CreateTaskWorkflowOpts,
	"fn" | "name" | keyof CreateBaseWorkflowOpts
>;
export const Task = (_opts: TaskOpts): MethodDecorator => {
	return (
		_target: any,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<any>,
	) => {
		Reflect.defineMetadata("taskOpts", _opts, descriptor.value);
		return descriptor;
	};
};
