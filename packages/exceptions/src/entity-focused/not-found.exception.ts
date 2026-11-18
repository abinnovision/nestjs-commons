import { EntityFocusedAppException } from "./entity-focused-app-exception.js";

import type {
	AppExceptionOptsWithoutMeta,
	HttpAwareException,
} from "../app-exception.js";
import type { EntityFocusedArgs } from "./entity-focused.interface.js";

/**
 * Exception thrown when an entity is not found.
 *
 * @example
 * ```typescript
 * throw new EntityNotFoundException({ entity: 'user', entityId: '123' });
 * // Error message: "user with ID '123' not found"
 * ```
 */
export class EntityNotFoundException
	extends EntityFocusedAppException
	implements HttpAwareException
{
	public readonly code = "COMMON__NOT_FOUND";
	public readonly httpStatus = 404;

	/**
	 * Creates a new EntityNotFoundException.
	 *
	 * @param args - The entity type and ID that was not found
	 * @param opts - Additional exception options
	 */
	public constructor(
		args: EntityFocusedArgs,
		opts?: AppExceptionOptsWithoutMeta,
	) {
		super(args, `${args.entity} with ID '${args.entityId}' not found`, opts);
	}
}
