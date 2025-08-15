import { Injectable } from "@nestjs/common";

import { DiscoveryCompWorkflow, METADATA_KEY_HOST_OPTS } from "../internal";

import type { CreateBaseWorkflowOpts } from "@hatchet-dev/typescript-sdk";

export type HostOpts = Omit<CreateBaseWorkflowOpts, "on">;

/**
 * Decorator to mark a class as a host (for either a workflow or a task).
 */
export const Host = (_opts: HostOpts): ClassDecorator => {
	return (target: any) => {
		// Make the workflow injectable.
		Injectable()(target);

		// Add the workflow options.
		Reflect.defineMetadata(METADATA_KEY_HOST_OPTS, _opts, target);
		DiscoveryCompWorkflow()(target);

		return target;
	};
};
