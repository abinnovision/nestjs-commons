import { sanitizeString as sanitizeStringDirect } from "./sanitize.js";

import type { SanitizeOptions } from "./sanitize.js";

/**
 * Remeda-compatible (data-last) variant of `sanitizeString`.
 *
 * Returns a function that, given a string, produces a sanitized copy with
 * HTML tags removed and whitespace normalized. Designed to be used inside
 * `R.pipe(...)` and exposed as `R.sanitizeString`.
 *
 * @example
 * ```typescript
 * import { R } from '@abinnovision/nestjs-toolkit';
 *
 * R.pipe("<script>alert('xss')</script>Hello", R.sanitizeString()); // "Hello"
 * R.pipe("  Hello  ", R.sanitizeString({ trim: false }));           // " Hello "
 * ```
 */
export function sanitizeString(
	options?: SanitizeOptions,
): (data: string) => string {
	return (data: string) => sanitizeStringDirect(data, options);
}
