import type { AnyHostCtor } from "../ref";

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
