import { compileMessage, messageArguments } from "./internal/formatter.js";

function safeArguments(message: string): Set<string> | undefined {
	try {
		return messageArguments(message);
	} catch {
		return undefined;
	}
}

/**
 * A problem found by {@link verifyCatalogs}.
 */
export interface CatalogIssue {
	locale: string;
	key: string;
	kind: "missing" | "extra" | "parse-error" | "unknown-argument";
}

/**
 * Compares every catalog against the default locale and parses all messages.
 * Reports arguments of a message that the default-locale message lacks.
 *
 * @example
 * ```typescript
 * expect(verifyCatalogs({ en, de }, "en")).toEqual([]);
 * ```
 */
export function verifyCatalogs(
	catalogs: Record<string, Record<string, string>>,
	defaultLocale: string,
): CatalogIssue[] {
	const issues: CatalogIssue[] = [];
	const defaultCatalog = catalogs[defaultLocale] ?? {};
	const defaultKeys = Object.keys(defaultCatalog);

	for (const [locale, catalog] of Object.entries(catalogs)) {
		for (const key of defaultKeys) {
			if (!Object.hasOwn(catalog, key)) {
				issues.push({ locale, key, kind: "missing" });
			}
		}

		for (const [key, message] of Object.entries(catalog)) {
			if (!defaultKeys.includes(key)) {
				issues.push({ locale, key, kind: "extra" });
			}

			try {
				compileMessage(message, locale);
			} catch {
				issues.push({ locale, key, kind: "parse-error" });
				continue;
			}

			const defaultMessage = defaultCatalog[key];

			if (locale !== defaultLocale && defaultMessage !== undefined) {
				const known = safeArguments(defaultMessage);
				const used = messageArguments(message);

				if (known && [...used].some((name) => !known.has(name))) {
					issues.push({ locale, key, kind: "unknown-argument" });
				}
			}
		}
	}

	return issues;
}
