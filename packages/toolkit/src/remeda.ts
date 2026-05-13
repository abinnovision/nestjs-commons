import * as remeda from "remeda";

import { isNullishOrEmptyString } from "./string/guards";
import { sanitizeString } from "./string/sanitize.remeda";
import { slugify } from "./string/slugify.remeda";
import { isUUID } from "./uuid/is-uuid";

/**
 * Remeda re-export augmented with toolkit's remeda-compatible utilities.
 *
 * Exposes every function from `remeda` (see https://remedajs.com/docs/)
 * alongside data-last / pipe-friendly variants of toolkit helpers.
 *
 * @example
 * ```typescript
 * import { R } from '@abinnovision/nestjs-toolkit';
 *
 * R.pipe("  <b>Hello World!</b>  ", R.sanitizeString(), R.slugify()); // "hello-world"
 * ```
 */
export const R = {
	...remeda,
	slugify,
	sanitizeString,
	isUUID,
	isNullishOrEmptyString,
} as const;
