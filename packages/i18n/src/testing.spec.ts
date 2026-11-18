import { describe, expect, it } from "vitest";

import { de, en } from "./__fixtures__/catalogs.js";
import { verifyCatalogs } from "./testing.js";

describe("verifyCatalogs", () => {
	it("returns no issues for matching catalogs", () => {
		expect(verifyCatalogs({ en, de }, "en")).toEqual([]);
	});

	it("reports missing, extra and unparsable messages", () => {
		const issues = verifyCatalogs(
			{
				en: { greeting: "Hello {name}", farewell: "Goodbye" },
				de: { greeting: "Hallo {name", extra: "Extra" },
			},
			"en",
		);

		expect(issues).toEqual(
			expect.arrayContaining([
				{ locale: "de", key: "farewell", kind: "missing" },
				{ locale: "de", key: "extra", kind: "extra" },
				{ locale: "de", key: "greeting", kind: "parse-error" },
			]),
		);
		expect(issues).toHaveLength(3);
	});

	it("reports arguments unknown to the default locale", () => {
		expect(
			verifyCatalogs(
				{
					en: {
						greeting: "Hello {name}",
						items: "{count, plural, one {# item} other {# items}}",
					},
					de: {
						greeting: "Hallo {nmae}",
						items: "{count, plural, one {# Artikel} other {{count} Artikel}}",
					},
				},
				"en",
			),
		).toEqual([{ locale: "de", key: "greeting", kind: "unknown-argument" }]);
	});
});
