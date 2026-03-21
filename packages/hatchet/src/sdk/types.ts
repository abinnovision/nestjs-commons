/**
 * Minimal compatible interface for the Hatchet SDK's WorkflowRunRef.
 * Used internally to avoid deep subpath imports from the SDK.
 */
export interface WorkflowRunRef<T> {
	get output(): Promise<T>;
}
