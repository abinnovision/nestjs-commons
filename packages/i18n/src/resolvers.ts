import type { LocaleResolver } from "./i18n.module-config.js";

/**
 * Resolves the locales of the `Accept-Language` header, ordered by quality.
 */
export function acceptLanguage(): LocaleResolver {
	return (request) => {
		const header = request.headers?.["accept-language"];
		const value = Array.isArray(header) ? header.join(",") : header;

		if (!value) {
			return undefined;
		}

		return value
			.split(",")
			.map((part) => {
				const [tag = "", ...params] = part.trim().split(";");
				const quality = params
					.map((it) => it.trim())
					.find((it) => it.startsWith("q="));

				return {
					tag: tag.trim(),
					q: quality ? Number(quality.slice(2)) : 1,
				};
			})
			.filter((it) => it.tag && it.tag !== "*" && it.q > 0)
			.sort((a, b) => b.q - a.q)
			.map((it) => it.tag);
	};
}

/**
 * Resolves the locale from a query parameter.
 *
 * @param name - The query parameter name. Defaults to `lang`.
 */
export function queryParam(name = "lang"): LocaleResolver {
	return (request) => {
		const value = request.query?.[name];

		if (typeof value === "string") {
			return value;
		}

		if (Array.isArray(value)) {
			return value.filter((it): it is string => typeof it === "string");
		}

		return undefined;
	};
}

/**
 * Resolves the locale with a custom function, e.g. from the user or a header.
 */
export function fromRequest(
	fn: (request: any) => string | readonly string[] | undefined,
): LocaleResolver {
	return fn;
}
