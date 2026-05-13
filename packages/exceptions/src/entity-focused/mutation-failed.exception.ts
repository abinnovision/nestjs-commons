import { EntityFocusedAppException } from "./entity-focused-app-exception";

import type {
	AppExceptionOptsWithoutMeta,
	HttpAwareException,
} from "../app-exception";
import type { EntityFocusedArgs } from "./entity-focused.interface";

/**
 * The type of mutation that failed.
 */
export type EntityMutationType = "create" | "update" | "delete";

/**
 * Arguments for creating an EntityMutationFailedException.
 */
export interface EntityMutationFailedArgs extends EntityFocusedArgs {
	/**
	 * The type of mutation that failed.
	 */
	mutationType: EntityMutationType;
}

/**
 * Exception thrown when a create, update, or delete operation fails.
 *
 * @example
 * ```typescript
 * // Basic usage
 * throw new EntityMutationFailedException({
 *   entity: 'user',
 *   entityId: '123',
 *   mutationType: 'update',
 * });
 * // Error message: "Failed to update user with ID '123'"
 *
 * // With configured entity name renderer
 * configureEntityNameRenderer({ user: 'User' });
 * throw new EntityMutationFailedException({
 *   entity: 'user',
 *   entityId: '123',
 *   mutationType: 'delete',
 * });
 * // Error message: "Failed to delete User with ID '123'"
 * ```
 */
export class EntityMutationFailedException
	extends EntityFocusedAppException
	implements HttpAwareException
{
	public override code = "COMMON__MUTATION_FAILED";
	public readonly httpStatus = 400;

	/**
	 * The type of mutation that failed.
	 */
	public readonly mutationType: EntityMutationType;

	/**
	 * Creates a new EntityMutationFailedException.
	 *
	 * @param args - The entity type, ID, and mutation type
	 * @param opts - Additional exception options
	 */
	public constructor(
		args: EntityMutationFailedArgs,
		opts?: AppExceptionOptsWithoutMeta,
	) {
		super(
			args,
			(displayName, entityId) =>
				`Failed to ${args.mutationType} ${displayName} with ID '${entityId}'`,
			opts,
		);

		this.mutationType = args.mutationType;
	}
}
