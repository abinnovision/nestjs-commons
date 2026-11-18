import { EntityFocusedAppException } from "./entity-focused-app-exception.js";

import type {
	AppExceptionOptsWithoutMeta,
	HttpAwareException,
} from "../app-exception.js";
import type {
	EntityFocusedArgs,
	EntityFocusedMeta,
} from "./entity-focused.interface.js";

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
 * throw new EntityMutationFailedException({
 *   entity: 'user',
 *   entityId: '123',
 *   mutationType: 'update',
 * });
 * // Error message: "Failed to update user with ID '123'"
 * ```
 */
export class EntityMutationFailedException
	extends EntityFocusedAppException
	implements HttpAwareException
{
	public readonly code = "COMMON__MUTATION_FAILED";
	public readonly httpStatus = 400;

	declare public readonly meta: EntityFocusedMeta & {
		mutationType: EntityMutationType;
	};

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
			`Failed to ${args.mutationType} ${args.entity} with ID '${args.entityId}'`,
			opts,
		);

		this.mutationType = args.mutationType;
		this.meta = { ...this.meta, mutationType: args.mutationType };
	}
}
