import { WorkflowHost } from "../abstracts";
import {
	METADATA_KEY_HOST_OPTS,
	METADATA_KEY_TASK_OPTS,
	METADATA_KEY_WORKFLOW_TASK_OPTS,
} from "../internal";

import type { HostOpts, TaskOpts, WorkflowTaskOpts } from "../decorators";
import type { AnyHost } from "../ref";
import type { Reflector } from "@nestjs/core";
import type { MetadataScanner } from "@nestjs/core/metadata-scanner";

/**
 * Retrieves the host metadata from the given target.
 */
export const getHostMetadata = (
	target: AnyHost,
	reflector: Reflector,
): HostOpts => {
	return reflector.get(METADATA_KEY_HOST_OPTS, target.constructor);
};

/**
 * Retrieves all the methods of the host that are annotated with the appropriate metadata key.
 * This supports both WorkflowHost and TaskHost.a
 */
export const getHostAnnotatedMethods = (
	target: AnyHost,
	scanner: MetadataScanner,
): string[] => {
	const markerKey =
		target instanceof WorkflowHost
			? METADATA_KEY_WORKFLOW_TASK_OPTS
			: METADATA_KEY_TASK_OPTS;

	const proto = Object.getPrototypeOf(target);

	return scanner.getAllMethodNames(proto).filter((method) => {
		const ref = proto[method];
		const metadata = Reflect.getMetadata(markerKey, ref);
		return metadata !== undefined;
	});
};

/**
 * Retrieves the metadata for the given method of the workflow host.
 */
export const getWorkflowTaskMetadata = (
	target: AnyHost,
	method: string,
): WorkflowTaskOpts<any> => {
	return Reflect.getMetadata(METADATA_KEY_WORKFLOW_TASK_OPTS, target, method);
};

/**
 * Retrieves the metadata for the given method of the task host.
 */
export const getTaskMetadata = (target: AnyHost, method: string): TaskOpts => {
	return Reflect.getMetadata(METADATA_KEY_TASK_OPTS, target, method);
};
