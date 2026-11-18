import { defaultExceptionMessages } from "../exceptions/default-messages.js";
import { defineCatalog } from "../i18n.registry.js";

import type { CatalogShape } from "../i18n.registry.js";

declare module "../i18n.registry.js" {
	interface I18nRegistry {
		catalog: typeof en;
		locales: "en" | "de";
	}
}

export const en = defineCatalog({
	...defaultExceptionMessages,
	"exceptions.USER__EMAIL_TAKEN": "Email ''{email}'' is already taken",
	"entities.user": "User",
	greeting: "Hello {name}",
	farewell: "Goodbye",
	items: "{count, plural, one {# item} other {# items}}",
	"only.en": "Only in English",
});

export const de: CatalogShape = {
	"exceptions.COMMON__NOT_FOUND":
		"{entity} mit ID ''{entityId}'' wurde nicht gefunden",
	"exceptions.COMMON__MUTATION_FAILED":
		"{entity} mit ID ''{entityId}'' konnte nicht verarbeitet werden",
	"exceptions.DEFAULT__INTERNAL_SERVER_ERROR":
		"Ein interner Serverfehler ist aufgetreten",
	"exceptions.DEFAULT__MULTIPLE_ERRORS": "Mehrere Fehler sind aufgetreten",
	"exceptions.USER__EMAIL_TAKEN": "E-Mail ''{email}'' ist bereits vergeben",
	"entities.user": "Benutzer",
	greeting: "Hallo {name}",
	farewell: "Auf Wiedersehen",
	items: "{count, plural, one {# Artikel} other {# Artikel}}",
	"only.en": "Nur auf Englisch",
};

/**
 * German catalog without `only.en`, to exercise the default-locale fallback.
 */
export const deIncomplete = Object.fromEntries(
	Object.entries(de).filter(([key]) => key !== "only.en"),
) as CatalogShape;
