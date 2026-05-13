/**
 * Options for the slugify function.
 */
export interface SlugifyOptions {
	/**
	 * Maximum length of the resulting slug.
	 * @default 100
	 */
	maxLength?: number;

	/**
	 * Separator character to use between words.
	 * @default "-"
	 */
	separator?: string;
}

/**
 * Convert a string to a URL-safe slug.
 *
 * For remeda-compatible (data-last / pipe-friendly) usage, use
 * `R.slugify(opts?)` from the `R` namespace instead.
 *
 * @example
 * ```typescript
 * slugify("Hello World!");                   // "hello-world"
 * slugify("Hello World!", { maxLength: 5 }); // "hello"
 * ```
 */
export function slugify(data: string, options: SlugifyOptions = {}): string {
	const { maxLength = 100, separator = "-" } = options;

	return (
		data
			// Convert to lowercase
			.toLowerCase()
			// Normalize Unicode characters (decompose accented characters)
			.normalize("NFD")
			// Remove diacritical marks
			.replace(/[̀-ͯ]/g, "")
			// Replace any non-alphanumeric characters with the separator
			.replace(/[^a-z0-9]+/g, separator)
			// Remove leading/trailing separators
			.replace(new RegExp(`^${separator}|${separator}$`, "g"), "")
			// Truncate to max length
			.slice(0, maxLength)
	);
}
