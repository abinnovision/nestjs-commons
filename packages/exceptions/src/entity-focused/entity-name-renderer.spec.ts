import { afterEach, describe, expect, it } from "vitest";

import {
	configureEntityNameRenderer,
	getEntityDisplayName,
	resetEntityNameRenderer,
} from "./entity-name-renderer";

describe("entity-focused/entity-name-renderer.ts", () => {
	afterEach(() => {
		resetEntityNameRenderer();
	});

	describe("#configureEntityNameRenderer()", () => {
		it("sets global display names", () => {
			configureEntityNameRenderer({ user: "User Account" });

			expect(getEntityDisplayName("user")).toBe("User Account");
		});
	});

	describe("#getEntityDisplayName()", () => {
		it("returns entity name by default", () => {
			expect(getEntityDisplayName("user")).toBe("user");
		});

		it("uses configured display names", () => {
			configureEntityNameRenderer({ user: "User Profile" });

			expect(getEntityDisplayName("user")).toBe("User Profile");
		});

		it("falls back to entity name if not in record", () => {
			configureEntityNameRenderer({ user: "User" });

			expect(getEntityDisplayName("unknown")).toBe("unknown");
		});
	});

	describe("#resetEntityNameRenderer()", () => {
		it("resets to default renderer", () => {
			configureEntityNameRenderer({ user: "User" });

			expect(getEntityDisplayName("user")).toBe("User");

			resetEntityNameRenderer();

			expect(getEntityDisplayName("user")).toBe("user");
		});
	});
});
