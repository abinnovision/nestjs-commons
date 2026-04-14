export type {
	EntityRegistry,
	EntityName,
	EntityFocusedMeta,
	EntityFocusedArgs,
	EntityFocusedException,
} from "./entity-focused.interface";

export {
	configureEntityNameRenderer,
	getEntityDisplayName,
	resetEntityNameRenderer,
} from "./entity-name-renderer";

export { EntityFocusedAppException } from "./entity-focused-app-exception";

export { NotFoundException } from "./not-found.exception";

export {
	MutationFailedException,
	type MutationType,
	type MutationFailedArgs,
} from "./mutation-failed.exception";
