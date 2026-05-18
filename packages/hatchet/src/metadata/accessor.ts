/* eslint-disable @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment */
import {
	METADATA_KEY_HOST_OPTS,
	METADATA_KEY_TASK_OPTS,
	METADATA_KEY_WORKFLOW_TASK_OPTS,
} from "./keys.js";
import { translateHostOpts } from "./translator.js";
import { TaskHost, WorkflowHost } from "../abstracts/index.js";

import type {
	HostOpts,
	TaskOpts,
	WorkflowTaskOpts,
} from "./decorators/index.js";
import type { SdkHostOpts } from "./translator.js";
import type { AnyHost, AnyHostCtor } from "../references/shared.js";

/**
 * Cache of decorated method names keyed by host constructor. Decorator
 * metadata is fixed at class-definition time, so this is safe to memoize for
 * the lifetime of the constructor.
 */
const methodsCache = new WeakMap<AnyHostCtor, string[]>();

/**
 * Accessor for host metadata and methods.
 */
class HostAccessor {
	public constructor(public readonly ctor: AnyHostCtor) {}

	/**
	 * Returns raw enhanced metadata from @Host() decorator.
	 */
	public get metadata(): HostOpts {
		return Reflect.getMetadata(METADATA_KEY_HOST_OPTS, this.ctor);
	}

	/**
	 * Returns SDK-compatible options for workflow declarations.
	 */
	public get sdkOpts(): SdkHostOpts {
		return translateHostOpts(this.metadata);
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
		const cached = methodsCache.get(this.ctor);

		if (cached !== undefined) {
			return cached;
		}

		const markerKey = this.isWorkflow
			? METADATA_KEY_WORKFLOW_TASK_OPTS
			: METADATA_KEY_TASK_OPTS;

		const proto = this.ctor.prototype;

		const result = Object.getOwnPropertyNames(proto)
			.filter(
				(name) => name !== "constructor" && typeof proto[name] === "function",
			)
			.filter(
				(method) => Reflect.getMetadata(markerKey, proto[method]) !== undefined,
			);

		methodsCache.set(this.ctor, result);

		return result;
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
