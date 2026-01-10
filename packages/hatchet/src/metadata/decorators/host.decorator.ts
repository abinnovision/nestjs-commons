import { Injectable } from "@nestjs/common";

import { METADATA_KEY_HOST_OPTS } from "../keys";

import type { AnyEventDefinition } from "../../events";
import type { CreateBaseWorkflowOpts } from "@hatchet-dev/typescript-sdk";

/**
 * Properties we enhance beyond SDK types.
 */
interface EnhancedProperties {
	name: string;
	onEvents?: ReadonlyArray<string | AnyEventDefinition>;
}

type PassthroughProperties = Omit<
	CreateBaseWorkflowOpts,
	"on" | keyof EnhancedProperties
>;

/**
 * Enhanced HostOpts for @Host() decorator.
 */
export type HostOpts = EnhancedProperties & PassthroughProperties;

/**
 * Decorator to mark a class as a host (for either a workflow or a task).
 */
export const Host = (opts: HostOpts): ClassDecorator => {
	return (target) => {
		// Make the workflow injectable.
		Injectable()(target);

		// Add the workflow options.
		Reflect.defineMetadata(METADATA_KEY_HOST_OPTS, opts, target);

		return target;
	};
};
