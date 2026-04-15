import { EntityFocusedAppException } from "./entity-focused-app-exception";

import type {
	AppExceptionOptsWithoutMeta,
	HttpAwareException,
} from "../app-exception";
import type { EntityFocusedArgs } from "./entity-focused.interface";

/**
 * The type of mutation that failed.
 */
export type MutationType = "create" | "update" | "delete";

/**
 * Arguments for creating a MutationFailedException.
 */
export interface MutationFailedArgs extends EntityFocusedArgs {
	/**
	 * The type of mutation that failed.
	 */
	mutationType: MutationType;
}

/**
 * Exception thrown when a create, update, or delete operation fails.
 *
 * @example
 * ```typescript
 * // Basic usage
 * throw new MutationFailedException({
 *   entity: 'user',
 *   entityId: '123',
 *   mutationType: 'update',
 * });
 * // Error message: "Failed to update user with ID '123'"
 *
 * // With configured entity name renderer
 * configureEntityNameRenderer({ user: 'User' });
 * throw new MutationFailedException({
 *   entity: 'user',
 *   entityId: '123',
 *   mutationType: 'delete',
 * });
 * // Error message: "Failed to delete User with ID '123'"
 * ```
 */
export class MutationFailedException
	extends EntityFocusedAppException
	implements HttpAwareException
{
	public override code = "COMMON__MUTATION_FAILED";
	public readonly httpStatus = 400;

	/**
	 * The type of mutation that failed.
	 */
	public readonly mutationType: MutationType;

	/**
	 * Creates a new MutationFailedException.
	 *
	 * @param args - The entity type, ID, and mutation type
	 * @param opts - Additional exception options
	 */
	public constructor(
		args: MutationFailedArgs,
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
