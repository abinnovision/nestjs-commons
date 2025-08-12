import { Injectable } from "@nestjs/common";

import type { CreateBaseWorkflowOpts } from "@hatchet-dev/typescript-sdk";

export type WorkflowOpts = Omit<CreateBaseWorkflowOpts, "on">;

export const Workflow = (_opts: WorkflowOpts): ClassDecorator => {
	return (target: any) => {
		// Make the workflow injectable.
		Injectable()(target);

		// Add the workflow options.
		Reflect.defineMetadata("workflowOpts", _opts, target);

		return target;
	};
};
