import { defineCatalog } from "../i18n.registry.js";

/**
 * English messages for the built-in exception codes. Spread them into the
 * default-locale catalog.
 */
export const defaultExceptionMessages = defineCatalog({
	"exceptions.COMMON__NOT_FOUND": "{entity} with ID ''{entityId}'' not found",
	"exceptions.COMMON__MUTATION_FAILED":
		"Failed to {mutationType, select, create {create} update {update} other {delete}} {entity} with ID ''{entityId}''",
	"exceptions.DEFAULT__INTERNAL_SERVER_ERROR":
		"An internal server error occurred",
	"exceptions.DEFAULT__MULTIPLE_ERRORS": "Multiple errors occurred",
});
