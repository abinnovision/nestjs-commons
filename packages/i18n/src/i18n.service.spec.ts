import { Logger } from "@nestjs/common";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { de, deIncomplete, en } from "./__fixtures__/catalogs.js";
import { I18nContext } from "./i18n.context.js";
import { I18nService } from "./i18n.service.js";
import { acceptLanguage, fromRequest } from "./resolvers.js";

import type { I18nModuleConfig } from "./i18n.module-config.js";

function createService(config: Partial<I18nModuleConfig> = {}) {
	const context = new I18nContext();
	const service = new I18nService(
		{ defaultLocale: "en", catalogs: { en, de }, ...config },
		context,
	);

	return { service, context };
}

describe("i18nService", () => {
	it("translates with the default locale outside a context", () => {
		const { service } = createService();

		expect(service.locale).toBe("en");
		expect(service.t("greeting", { name: "Ada" })).toBe("Hello Ada");
		expect(service.t("items", { count: 2 })).toBe("2 items");
	});

	it("uses an explicit locale", () => {
		const { service } = createService();

		expect(service.t("greeting", { name: "Ada" }, { locale: "de" })).toBe(
			"Hallo Ada",
		);
	});

	it("uses the locale of run()", () => {
		const { service } = createService();

		const result = service.run("de", () => service.t("farewell"));

		expect(result).toBe("Auf Wiedersehen");
	});

	it("negotiates explicit locales", () => {
		const { service } = createService();
		// Simulates a locale from untyped input, e.g. a task payload.
		const austrian = "de-AT" as "de";

		expect(service.run(austrian, () => service.locale)).toBe("de");
		expect(service.t("farewell", {}, { locale: austrian })).toBe(
			"Auf Wiedersehen",
		);
		expect(service.t("farewell", {}, { locale: "fr" as "de" })).toBe("Goodbye");
	});

	it("resolves the locale of the request in the context", () => {
		const { service, context } = createService();
		const request = { headers: { "accept-language": "de-AT,de;q=0.9" } };

		context.run({ request }, () => {
			expect(service.locale).toBe("de");
			expect(service.t("farewell")).toBe("Auf Wiedersehen");
		});
	});

	it("does not memoize the locale of a request", () => {
		const { service, context } = createService({
			resolvers: [
				fromRequest(
					(request: { user?: { locale: string } }) => request.user?.locale,
				),
				acceptLanguage(),
			],
		});
		const request: {
			headers: Record<string, string>;
			user?: { locale: string };
		} = {
			headers: {},
		};

		context.run({ request }, () => {
			expect(service.t("farewell")).toBe("Goodbye");

			request.user = { locale: "de" };

			expect(service.t("farewell")).toBe("Auf Wiedersehen");
		});
	});

	it("falls back to the default locale for a missing key", () => {
		const { service } = createService({ catalogs: { en, de: deIncomplete } });

		expect(service.t("only.en", {}, { locale: "de" })).toBe("Only in English");
	});

	it("returns the key and warns when missing in the default locale", () => {
		const warn = vi
			.spyOn(Logger.prototype, "warn")
			.mockImplementation(() => {});
		const { service } = createService({
			catalogs: { en: deIncomplete, de },
		});

		expect(service.t("only.en")).toBe("only.en");
		expect(warn).toHaveBeenCalledOnce();

		warn.mockRestore();
	});

	it("types message params", () => {
		const { service } = createService();
		const translate = () => {
			// @ts-expect-error missing params
			service.t("greeting");
			// @ts-expect-error missing name
			service.t("greeting", {});
			// @ts-expect-error misspelled name
			service.t("greeting", { nam: "Ada" });
			// @ts-expect-error count must be a number
			service.t("items", { count: "2" });
			// @ts-expect-error fr is not a registered locale
			service.t("farewell", {}, { locale: "fr" });
		};

		expectTypeOf(translate).toBeFunction();
		expectTypeOf(service.t("farewell")).toBeString();
		expectTypeOf(service.t("items", { count: 1 })).toBeString();
		expectTypeOf(
			service.t("greeting", { name: "Ada" }, { locale: "de" }),
		).toBeString();
	});

	it("rejects unknown keys at compile time", () => {
		const { service } = createService();

		const translate = () =>
			// @ts-expect-error unknown key
			service.t("unknown.key");

		expectTypeOf(translate).toBeFunction();
	});
});
