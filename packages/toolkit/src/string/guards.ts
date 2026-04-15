/**
 * Type guard that checks if a value is null, undefined, or an empty string.
 *
 * @example
 * ```typescript
 * isNullishOrEmptyString(null);      // true
 * isNullishOrEmptyString(undefined); // true
 * isNullishOrEmptyString("");        // true
 * isNullishOrEmptyString("hello");   // false
 * isNullishOrEmptyString(0);         // false
 * ```
 *
 * @param value - The value to check
 * @returns True if the value is null, undefined, or an empty string
 */
export function isNullishOrEmptyString(
	value: unknown,
): value is null | undefined | "" {
	return value === null || value === undefined || value === "";
}
