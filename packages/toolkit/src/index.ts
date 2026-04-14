/**
 * @abinnovision/nestjs-toolkit
 *
 * NestJS toolkit with remeda utilities and common helpers.
 */

// Re-export remeda as R
export { R } from "./remeda";

// String utilities
export {
	slugify,
	type SlugifyOptions,
	sanitizeString,
	type SanitizeOptions,
	isNullishOrEmptyString,
} from "./string";

// UUID utilities
export { isUuid, generateUuid } from "./uuid";
