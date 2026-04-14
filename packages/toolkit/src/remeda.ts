/**
 * Re-export remeda as R for convenient access to functional utilities.
 *
 * @example
 * ```typescript
 * import { R } from '@abinnovision/nestjs-toolkit';
 *
 * const doubled = R.pipe([1, 2, 3], R.map(x => x * 2));
 * const unique = R.unique([1, 2, 2, 3]);
 * ```
 *
 * @see https://remedajs.com/docs/ for full documentation
 */
export * as R from "remeda";
