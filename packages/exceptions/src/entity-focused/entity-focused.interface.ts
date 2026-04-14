/**
 * Augmentable registry for entity names.
 *
 * Consumers declare their entities via module augmentation:
 *
 * @example
 * ```typescript
 * declare module '@abinnovision/nestjs-exceptions' {
 *   interface EntityRegistry {
 *     entities: 'user' | 'organization' | 'user_profile';
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EntityRegistry {}

/**
 * Resolves to the consumer-defined entity union when augmented,
 * falls back to `string` when not augmented.
 */
export type EntityName = EntityRegistry extends { entities: infer E }
	? E & string
	: string;

/**
 * Metadata attached to entity-focused exceptions.
 */
export interface EntityFocusedMeta {
	/**
	 * The name of the entity (e.g., database table name).
	 */
	entityName: string;

	/**
	 * The ID of the entity that caused the exception.
	 */
	entityId: string;
}

/**
 * Arguments for creating entity-focused exceptions.
 *
 * When the {@link EntityRegistry} is augmented, the `entity` field
 * is type-checked against the registered entity names.
 *
 * @example
 * ```typescript
 * const args: EntityFocusedArgs = { entity: 'user', entityId: '123' };
 * ```
 */
export interface EntityFocusedArgs {
	/**
	 * The entity type/name.
	 */
	entity: EntityName;

	/**
	 * The ID of the entity.
	 */
	entityId: string;
}

/**
 * Interface implemented by all entity-focused exceptions.
 */
export interface EntityFocusedException {
	/**
	 * The raw entity name.
	 */
	readonly entity: string;

	/**
	 * The ID of the entity.
	 */
	readonly entityId: string;

	/**
	 * The human-readable display name for the entity.
	 */
	readonly entityDisplayName: string;
}
