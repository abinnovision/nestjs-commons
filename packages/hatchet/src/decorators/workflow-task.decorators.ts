import type { CtxWorkflow } from "../context";
import type { ContextMethodKeys, WorkflowHostCtor } from "../ref";
import type { CreateWorkflowTaskOpts } from "@hatchet-dev/typescript-sdk/v1/task";

export type WorkflowTaskOpts<C extends WorkflowHostCtor<any>> = Omit<
	CreateWorkflowTaskOpts,
	"fn" | "parents" | "name"
> & {
	parents?: ContextMethodKeys<InstanceType<C>, CtxWorkflow<any>>[];
};

export function WorkflowTask<C extends WorkflowHostCtor<any>>(
	_opts: WorkflowTaskOpts<C>,
): MethodDecorator {
	return (
		_target: any,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<any>,
	) => {
		Reflect.defineMetadata("workflowTaskOpts", _opts, descriptor.value);
		return descriptor;
	};
}
