import type { CatalogShape, Locale } from "./i18n.registry.js";

/**
 * The request as seen by locale resolvers.
 */
export interface I18nRequest {
	headers?: Record<string, string | string[] | undefined>;
	query?: Record<string, unknown>;
}

/**
 * Returns locale candidates for a request, in order of preference.
 */
export type LocaleResolver = (
	request: I18nRequest,
) => string | readonly string[] | undefined;

/**
 * Configuration for the I18nModule.
 */
export interface I18nModuleConfig {
	/**
	 * The locale used when no resolver matches. Must be a key of `catalogs`.
	 */
	defaultLocale: Locale;

	/**
	 * One catalog per locale.
	 */
	catalogs: { readonly [L in Locale]: CatalogShape };

	/**
	 * Tried in order; the first supported match wins.
	 *
	 * @default [acceptLanguage()]
	 */
	resolvers?: readonly LocaleResolver[] | undefined;

	/**
	 * Whether to mount the request context middleware on all routes.
	 *
	 * @default true
	 */
	middleware?: boolean | undefined;
}

export const i18nModuleConfigToken = Symbol("i18n:module:config");
