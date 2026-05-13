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
 * Implementation of the sanitizeString function.
 */
function sanitizeStringImpl(
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

/**
 * Sanitize a string by removing HTML tags and normalizing whitespace.
 *
 * This function is pipe-compatible with remeda, supporting both data-first
 * and data-last calling styles.
 *
 * @example Data-first (direct call)
 * ```typescript
 * sanitizeString("  <b>Hello</b>  World  "); // "Hello World"
 * sanitizeString("  Hello  ", { trim: false }); // " Hello "
 * ```
 *
 * @example Data-last (in pipes)
 * ```typescript
 * import { R } from '@abinnovision/nestjs-toolkit';
 *
 * R.pipe("<script>alert('xss')</script>Hello", sanitizeString()); // "Hello"
 * ```
 */
export function sanitizeString(
	options?: SanitizeOptions,
): (data: string) => string;
export function sanitizeString(data: string, options?: SanitizeOptions): string;
export function sanitizeString(
	dataOrOptions?: string | SanitizeOptions,
	options?: SanitizeOptions,
): string | ((data: string) => string) {
	// Data-last: called with no args or with options object
	if (dataOrOptions === undefined || typeof dataOrOptions === "object") {
		return (data: string) => sanitizeStringImpl(data, dataOrOptions);
	}

	// Data-first: called with string data
	return sanitizeStringImpl(dataOrOptions, options);
}
