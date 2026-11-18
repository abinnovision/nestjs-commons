import { describe, expect, expectTypeOf, it } from "vitest";

import { acceptLanguage, fromRequest, queryParam } from "./resolvers.js";

import type { I18nRequest } from "./i18n.module-config.js";
import type { IncomingMessage } from "node:http";

/** Structurally matches an express `Request`. */
type ExpressLikeRequest = IncomingMessage & {
	query: Record<string, string | string[] | undefined>;
	params: Record<string, string>;
	user?: { locale: string };
};

describe("i18nRequest", () => {
	it("accepts node and express requests", () => {
		expectTypeOf<IncomingMessage>().toExtend<I18nRequest>();
		expectTypeOf<ExpressLikeRequest>().toExtend<I18nRequest>();
	});
});

describe("acceptLanguage", () => {
	const resolve = acceptLanguage();

	it("orders the locales by quality", () => {
		expect(
			resolve({
				headers: { "accept-language": "en;q=0.8, de-AT, de;q=0.9, *;q=0.1" },
			}),
		).toEqual(["de-AT", "de", "en"]);
	});

	it("drops locales with zero quality", () => {
		expect(resolve({ headers: { "accept-language": "de;q=0, en" } })).toEqual([
			"en",
		]);
	});

	it("returns undefined without the header", () => {
		expect(resolve({ headers: {} })).toBeUndefined();
		expect(resolve({})).toBeUndefined();
	});
});

describe("queryParam", () => {
	it("reads the lang parameter by default", () => {
		expect(queryParam()({ query: { lang: "de" } })).toBe("de");
	});

	it("reads a custom parameter and arrays", () => {
		expect(queryParam("locale")({ query: { locale: ["de", "en"] } })).toEqual([
			"de",
			"en",
		]);
	});

	it("returns undefined when absent", () => {
		expect(queryParam()({ query: {} })).toBeUndefined();
		expect(queryParam()({})).toBeUndefined();
	});
});

describe("fromRequest", () => {
	it("delegates to the given function", () => {
		const resolve = fromRequest(
			(request: { user?: { locale: string } }) => request.user?.locale,
		);

		const request = { headers: {}, user: { locale: "de" } };

		expect(resolve(request)).toBe("de");
		expect(resolve({})).toBeUndefined();
	});
});
