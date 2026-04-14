import type { EntityName } from "./entity-focused.interface";

/**
 * Global display name mapping - set once at app startup.
 */
let globalDisplayNames: Record<string, string> = {};

/**
 * Configure the global entity name renderer.
 *
 * Call this once at application startup (e.g., in main.ts) to set up
 * how entity names are converted to display names.
 *
 * @example
 * ```typescript
 * // main.ts
 * import { configureEntityNameRenderer } from '@abinnovision/nestjs-exceptions';
 *
 * configureEntityNameRenderer({
 *   user: 'User',
 *   organization: 'Organization',
 *   user_profile: 'User profile',
 * });
 * ```
 *
 * @param displayNames - Record mapping entity names to display names
 */
export function configureEntityNameRenderer(
	displayNames: Record<EntityName, string>,
): void {
	globalDisplayNames = displayNames;
}

/**
 * Get the display name for an entity using the global renderer.
 *
 * @param entity - The entity name to render
 * @returns The human-readable display name
 */
export function getEntityDisplayName(entity: string): string {
	return globalDisplayNames[entity] ?? entity;
}

/**
 * Reset the global renderer to the default (useful for testing).
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetEntityNameRenderer();
 * });
 * ```
 */
export function resetEntityNameRenderer(): void {
	globalDisplayNames = {};
}
