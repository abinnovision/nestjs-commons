import { v4 as uuidv4 } from "uuid";

/**
 * Generate a new UUIDv4 string.
 *
 * @example
 * ```typescript
 * const id = generateUuid();
 * // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 *
 * @returns A new UUIDv4 string
 */
export function generateUuid(): string {
	return uuidv4();
}
