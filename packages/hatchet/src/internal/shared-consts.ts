import type { Interceptor } from "../interceptor";
import type { AnyHostCtor } from "../ref";
import type { Type } from "@nestjs/common";

export const METADATA_KEY_HOST_OPTS = "hatchet:host:opts";
export const METADATA_KEY_TASK_OPTS = "hatchet:task:opts";
export const METADATA_KEY_WORKFLOW_TASK_OPTS = "hatchet:workflow:task:opts";

/**
 * Token class for feature registration discovery.
 * Each forFeature() call creates a provider with this class as token.
 */
export class HatchetFeatureRegistration {
	public constructor(public readonly refs: AnyHostCtor[]) {}
}

/**
 * Token class for interceptor registration.
 * Stores interceptor class references for later resolution via ModuleRef.
 */
export class InterceptorRegistration {
	public constructor(public readonly refs: Type<Interceptor>[]) {}
}
