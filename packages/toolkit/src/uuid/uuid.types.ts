declare const UUIDBrand: unique symbol;

/**
 * A branded string type representing a validated UUID.
 *
 * Prefer this over plain `string` in function signatures that require
 * a validated UUID — the brand prevents unvalidated strings from
 * being passed without an explicit narrowing step via {@link isUUID}.
 */
export type UUID = string & { readonly [UUIDBrand]: never };

/**
 * UUID versions supported by this package.
 */
export type UuidVersion = 4 | 5 | 7;
