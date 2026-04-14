/**
 * @abinnovision/nestjs-exceptions
 *
 * NestJS exception handling with entity-focused exceptions and GraphQL support.
 */

// Core classes
export {
	AppException,
	type AppExceptionOpts,
	type AppExceptionOptsWithoutMeta,
	type HttpAwareException,
	isHttpAwareException,
} from "./app-exception";

export { MultiAppException } from "./multi-app-exception";

export { GenericExceptionFilter } from "./generic-exception-filter";

// Entity-focused system
export {
	type EntityRegistry,
	type EntityName,
	type EntityFocusedMeta,
	type EntityFocusedArgs,
	type EntityFocusedException,
	configureEntityNameRenderer,
	getEntityDisplayName,
	resetEntityNameRenderer,
	EntityFocusedAppException,
	NotFoundException,
	MutationFailedException,
	type MutationType,
	type MutationFailedArgs,
} from "./entity-focused";
