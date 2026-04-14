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
 * Implementation of the slugify function.
 */
function slugifyImpl(data: string, options: SlugifyOptions = {}): string {
	const { maxLength = 100, separator = "-" } = options;

	return (
		data
			// Convert to lowercase
			.toLowerCase()
			// Normalize Unicode characters (decompose accented characters)
			.normalize("NFD")
			// Remove diacritical marks
			.replace(/[\u0300-\u036f]/g, "")
			// Replace any non-alphanumeric characters with the separator
			.replace(/[^a-z0-9]+/g, separator)
			// Remove leading/trailing separators
			.replace(new RegExp(`^${separator}|${separator}$`, "g"), "")
			// Truncate to max length
			.slice(0, maxLength)
	);
}

/**
 * Convert a string to a URL-safe slug.
 *
 * This function is pipe-compatible with remeda, supporting both data-first
 * and data-last calling styles.
 *
 * @example Data-first (direct call)
 * ```typescript
 * slugify("Hello World!"); // "hello-world"
 * slugify("Hello World!", { maxLength: 5 }); // "hello"
 * ```
 *
 * @example Data-last (in pipes)
 * ```typescript
 * import { R } from '@abinnovision/nestjs-toolkit';
 *
 * R.pipe("Hello World!", slugify()); // "hello-world"
 * R.pipe("Hello World!", slugify({ separator: "_" })); // "hello_world"
 * ```
 */
export function slugify(options?: SlugifyOptions): (data: string) => string;
export function slugify(data: string, options?: SlugifyOptions): string;
export function slugify(
	dataOrOptions?: string | SlugifyOptions,
	options?: SlugifyOptions,
): string | ((data: string) => string) {
	// Data-last: called with no args or with options object
	if (dataOrOptions === undefined || typeof dataOrOptions === "object") {
		return (data: string) => slugifyImpl(data, dataOrOptions);
	}

	// Data-first: called with string data
	return slugifyImpl(dataOrOptions, options);
}
