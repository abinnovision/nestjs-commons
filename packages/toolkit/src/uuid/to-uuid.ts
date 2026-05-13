import { validate } from "uuid";

import type { UUID } from "./uuid.types";

/**
 * Parse a string into a validated {@link UUID}.
 *
 * Use this when you have a raw string that you want to treat as a `UUID`
 * — module-scope constants, values coming out of config, or any place
 * where an `as UUID` cast would otherwise be tempting. The format is
 * validated at runtime; an invalid input throws.
 *
 * For boolean checks or in-place narrowing, use `isUUID` instead.
 *
 * @example
 * ```typescript
 * const NS = toUUID("f47ac10b-58cc-4372-a567-0e02b2c3d479");
 * ```
 *
 * @param value - The string to parse
 * @returns The same string, branded as {@link UUID}
 * @throws TypeError if `value` is not a valid UUID string
 */
export function toUUID(value: string): UUID {
	if (!validate(value)) {
		throw new TypeError(`Invalid UUID: ${value}`);
	}

	return value as UUID;
}
