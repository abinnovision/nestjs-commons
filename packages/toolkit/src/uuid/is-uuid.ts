import { validate } from "uuid";

import type { UUID } from "./uuid.types";

/**
 * Type guard that checks if a value is a valid UUID string.
 *
 * Narrows the value to the branded {@link UUID} type on success,
 * which allows it to be passed to functions that require a validated UUID
 * rather than a plain string.
 *
 * @example
 * ```typescript
 * isUUID("550e8400-e29b-41d4-a716-446655440000"); // true
 * isUUID("not-a-uuid");                           // false
 * isUUID(123);                                    // false
 * isUUID(null);                                   // false
 * ```
 *
 * @param value - The value to check
 * @returns True if the value is a valid UUID string
 */
export function isUUID(value: unknown): value is UUID {
	return typeof value === "string" && validate(value);
}
