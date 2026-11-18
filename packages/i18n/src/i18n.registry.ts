import type { IcuParams } from "./internal/icu-params.js";

/**
 * A value accepted as an ICU message parameter.
 */
export type MessageValue = string | number | boolean | Date | null | undefined;

/**
 * Augmentable registry for the message catalog and the supported locales.
 *
 * @example
 * ```typescript
 * declare module "@abinnovision/nestjs-i18n" {
 *   interface I18nRegistry {
 *     catalog: typeof en;
 *     locales: "en" | "de";
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface I18nRegistry {}

/**
 * The default-locale catalog type. Falls back to `Record<string, string>`
 * when the registry is not augmented.
 */
export type Catalog = I18nRegistry extends { catalog: infer C }
	? C
	: Record<string, string>;

/**
 * The supported locales. Falls back to `string` when not augmented.
 */
export type Locale = I18nRegistry extends { locales: infer L }
	? Extract<L, string>
	: string;

/**
 * A key of the default-locale catalog.
 */
export type MessageKey = Extract<keyof Catalog, string>;

/**
 * The parameters of the message with the given key, inferred from the
 * default-locale message.
 */
export type MessageParams<K extends MessageKey> =
	Catalog[K] extends infer S extends string
		? IcuParams<S>
		: Record<string, MessageValue>;

/**
 * The shape every locale catalog must satisfy: one message per key.
 */
export type CatalogShape = { readonly [K in MessageKey]: string };

/**
 * Defines a catalog and keeps its message literals, so keys can be inferred.
 */
export function defineCatalog<const C extends Record<string, string>>(
	catalog: C,
): C {
	return catalog;
}
