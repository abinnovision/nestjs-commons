import { slugify as slugifyDirect } from "./slugify.js";

import type { SlugifyOptions } from "./slugify.js";

/**
 * Remeda-compatible (data-last) variant of `slugify`.
 *
 * Returns a function that, given a string, produces its URL-safe slug.
 * Designed to be used inside `R.pipe(...)` and exposed as `R.slugify`.
 *
 * @example
 * ```typescript
 * import { R } from '@abinnovision/nestjs-toolkit';
 *
 * R.pipe("Hello World!", R.slugify());                   // "hello-world"
 * R.pipe("Hello World!", R.slugify({ separator: "_" })); // "hello_world"
 * ```
 */
export function slugify(options?: SlugifyOptions): (data: string) => string {
	return (data: string) => slugifyDirect(data, options);
}
