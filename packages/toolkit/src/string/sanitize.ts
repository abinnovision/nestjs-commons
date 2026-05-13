/**
 * Options for the sanitizeString function.
 */
export interface SanitizeOptions {
	/**
	 * Whether to trim whitespace from the result.
	 * @default true
	 */
	trim?: boolean;
}

/**
 * Sanitize a string by removing HTML tags and normalizing whitespace.
 *
 * For remeda-compatible (data-last / pipe-friendly) usage, use
 * `R.sanitizeString(opts?)` from the `R` namespace instead.
 *
 * @example
 * ```typescript
 * sanitizeString("  <b>Hello</b>  World  ");     // "Hello World"
 * sanitizeString("  Hello  ", { trim: false }); // " Hello "
 * ```
 */
export function sanitizeString(
	data: string,
	options: SanitizeOptions = {},
): string {
	const { trim = true } = options;

	let result = data
		// Remove HTML tags and their content for script/style tags
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
		// Remove remaining HTML tags (but keep content)
		.replace(/<[^>]*>/g, "")
		// Normalize Unicode
		.normalize("NFC")
		// Replace multiple whitespace with single space
		.replace(/\s+/g, " ");

	if (trim) {
		result = result.trim();
	}

	return result;
}
