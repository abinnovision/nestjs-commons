/* eslint-disable @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment */
import { TaskHost, WorkflowHost } from "../abstracts";
import {
	METADATA_KEY_HOST_OPTS,
	METADATA_KEY_TASK_OPTS,
	METADATA_KEY_WORKFLOW_TASK_OPTS,
} from "../internal";

import type { HostOpts, TaskOpts, WorkflowTaskOpts } from "../decorators";
import type { AnyHost, AnyHostCtor } from "../ref";

/**
 * Implementation of the unified host accessor.
 */
class HostAccessor {
	public constructor(public readonly ctor: AnyHostCtor) {}

	public get metadata(): HostOpts {
		return Reflect.getMetadata(METADATA_KEY_HOST_OPTS, this.ctor);
	}

	public get name(): string {
		return this.metadata.name;
	}

	public get isWorkflow(): boolean {
		return this.ctor.prototype instanceof WorkflowHost;
	}

	public get isTask(): boolean {
		return this.ctor.prototype instanceof TaskHost;
	}

	public get methods(): string[] {
		const markerKey = this.isWorkflow
			? METADATA_KEY_WORKFLOW_TASK_OPTS
			: METADATA_KEY_TASK_OPTS;

		const proto = this.ctor.prototype;

		return Object.getOwnPropertyNames(proto)
			.filter(
				(name) => name !== "constructor" && typeof proto[name] === "function",
			)
			.filter(
				(method) => Reflect.getMetadata(markerKey, proto[method]) !== undefined,
			);
	}

	public getWorkflowTaskMeta(method: string): WorkflowTaskOpts<any> {
		return Reflect.getMetadata(
			METADATA_KEY_WORKFLOW_TASK_OPTS,
			this.ctor.prototype[method],
		);
	}

	public getTaskMeta(method: string): TaskOpts {
		return Reflect.getMetadata(
			METADATA_KEY_TASK_OPTS,
			this.ctor.prototype[method],
		);
	}
}

/**
 * Create accessor from host constructor.
 */
export function fromCtor(ctor: AnyHostCtor): HostAccessor {
	return new HostAccessor(ctor);
}

/**
 * Create accessor from host instance.
 */
export function fromInstance(instance: AnyHost): HostAccessor {
	return new HostAccessor(instance.constructor as AnyHostCtor);
}
