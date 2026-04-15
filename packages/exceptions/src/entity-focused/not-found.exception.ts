import { EntityFocusedAppException } from "./entity-focused-app-exception";

import type {
	AppExceptionOptsWithoutMeta,
	HttpAwareException,
} from "../app-exception";
import type { EntityFocusedArgs } from "./entity-focused.interface";

/**
 * Exception thrown when an entity is not found.
 *
 * @example
 * ```typescript
 * // Basic usage
 * throw new NotFoundException({ entity: 'user', entityId: '123' });
 * // Error message: "user with ID '123' not found"
 *
 * // With configured entity name renderer
 * configureEntityNameRenderer({ user: 'User' });
 * throw new NotFoundException({ entity: 'user', entityId: '123' });
 * // Error message: "User with ID '123' not found"
 * ```
 */
export class NotFoundException
	extends EntityFocusedAppException
	implements HttpAwareException
{
	public override code = "COMMON__NOT_FOUND";
	public readonly httpStatus = 404;

	/**
	 * Creates a new NotFoundException.
	 *
	 * @param args - The entity type and ID that was not found
	 * @param opts - Additional exception options
	 */
	public constructor(
		args: EntityFocusedArgs,
		opts?: AppExceptionOptsWithoutMeta,
	) {
		super(
			args,
			(displayName, entityId) =>
				`${displayName} with ID '${entityId}' not found`,
			opts,
		);
	}
}
