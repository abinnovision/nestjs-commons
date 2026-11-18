import { AppException } from "../app-exception.js";

import type { AppExceptionOptsWithoutMeta } from "../app-exception.js";
import type {
	EntityFocusedArgs,
	EntityFocusedException,
	EntityFocusedMeta,
	EntityName,
} from "./entity-focused.interface.js";

/**
 * Abstract base class for entity-focused exceptions.
 *
 * Extend this class to create exceptions that are related to specific
 * entities. The entity name and ID are exposed as `meta`, so localizers
 * can render a user-facing message.
 *
 * @example
 * ```typescript
 * export class DuplicateEntityException extends EntityFocusedAppException {
 *   public readonly code = 'COMMON__DUPLICATE';
 *   public readonly httpStatus = 409;
 *
 *   constructor(args: EntityFocusedArgs, opts?: AppExceptionOptsWithoutMeta) {
 *     super(args, `${args.entity} with ID '${args.entityId}' already exists`, opts);
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
	 * Creates a new entity-focused exception.
	 *
	 * @param args - The entity and entityId
	 * @param details - English developer message
	 * @param opts - Additional exception options
	 */
	protected constructor(
		args: EntityFocusedArgs,
		details: string,
		opts?: AppExceptionOptsWithoutMeta,
	) {
		super(details, {
			...opts,
			meta: { entityName: args.entity, entityId: args.entityId },
		});

		this.entity = args.entity;
		this.entityId = args.entityId;
	}
}
