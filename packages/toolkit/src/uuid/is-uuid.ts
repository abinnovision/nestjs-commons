import { validate } from "uuid";

/**
 * Type guard that checks if a value is a valid UUID string.
 *
 * @example
 * ```typescript
 * isUuid("550e8400-e29b-41d4-a716-446655440000"); // true
 * isUuid("not-a-uuid");                           // false
 * isUuid(123);                                    // false
 * isUuid(null);                                   // false
 * ```
 *
 * @param value - The value to check
 * @returns True if the value is a valid UUID string
 */
export function isUuid(value: unknown): value is string {
	return typeof value === "string" && validate(value);
}
