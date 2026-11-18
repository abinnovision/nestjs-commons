import { describe, expect, it } from "vitest";

import { negotiateLocale } from "./negotiate.js";

describe("negotiateLocale", () => {
	const supported = ["en", "de", "pt-BR"];

	it("matches exactly, case-insensitive", () => {
		expect(negotiateLocale(["PT-br"], supported)).toBe("pt-BR");
	});

	it("matches the base language", () => {
		expect(negotiateLocale(["de-AT"], supported)).toBe("de");
	});

	it("tries the next candidate", () => {
		expect(negotiateLocale(["fr", "de"], supported)).toBe("de");
	});

	it("returns undefined without a match", () => {
		expect(negotiateLocale(["fr", "es-ES"], supported)).toBeUndefined();
		expect(negotiateLocale([], supported)).toBeUndefined();
	});
});
