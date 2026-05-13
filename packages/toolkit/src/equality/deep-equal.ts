import { isDeepStrictEqual } from "node:util";

/**
 * Deep structural equality check using strict comparison semantics.
 *
 * Delegates to {@link https://nodejs.org/api/util.html#utilisdeepstrictequalval1-val2 | `node:util#isDeepStrictEqual`}
 * to handle plain objects, arrays, `Map`, `Set`, `Date`, `RegExp`, typed
 * arrays, and circular references. Compares with `Object.is` semantics, so
 * `NaN` equals `NaN` and `+0` does not equal `-0`. No type coercion is
 * performed: a string and a number with the same textual value are not equal.
 *
 * @example
 * ```typescript
 * deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }); // true
 * deepEqual(new Map([["k", 1]]), new Map([["k", 1]])); // true
 * deepEqual({ a: 1 }, { a: 1, b: undefined });         // false
 * ```
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if the two values are deeply, strictly equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
	return isDeepStrictEqual(a, b);
}
