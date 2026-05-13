import { AppException } from "../app-exception";
import { getEntityDisplayName } from "./entity-name-renderer";

import type { AppExceptionOptsWithoutMeta } from "../app-exception";
import type {
	EntityFocusedArgs,
	EntityFocusedException,
	EntityFocusedMeta,
	EntityName,
} from "./entity-focused.interface";

/**
 * Abstract base class for entity-focused exceptions.
 *
 * Extend this class to create exceptions that are related to specific
 * entities. The exception will automatically use the global entity
 * name renderer to generate human-readable messages.
 *
 * @example
 * ```typescript
 * export class DuplicateEntityException extends EntityFocusedAppException {
 *   public override code = 'COMMON__DUPLICATE';
 *   public override httpStatus = 409;
 *
 *   constructor(args: EntityFocusedArgs, opts?: AppExceptionOptsWithoutMeta) {
 *     super(
 *       args,
 *       (displayName, entityId) => `${displayName} with ID '${entityId}' already exists`,
 *       opts
 *     );
 *   }
 * }
 * ```
 */
export abstract class EntityFocusedAppException
	extends AppException<EntityFocusedMeta>
	implements EntityFocusedException
{
	/**
	 * The raw entity name.
	 */
	public readonly entity: EntityName;

	/**
	 * The ID of the entity.
	 */
	public readonly entityId: string;

	/**
	 * The human-readable display name for the entity.
	 */
	public readonly entityDisplayName: string;

	/**
	 * Creates a new entity-focused exception.
	 *
	 * @param args - The entity and entityId
	 * @param messageTemplate - Function that generates the error message
	 * @param opts - Additional exception options
	 */
	public constructor(
		args: EntityFocusedArgs,
		messageTemplate: (displayName: string, entityId: string) => string,
		opts?: AppExceptionOptsWithoutMeta,
	) {
		const displayName = getEntityDisplayName(args.entity);
		const message = messageTemplate(displayName, args.entityId);

		super(message, {
			...opts,
			meta: { entityName: args.entity, entityId: args.entityId },
		});

		this.entity = args.entity;
		this.entityId = args.entityId;
		this.entityDisplayName = displayName;
	}
}
