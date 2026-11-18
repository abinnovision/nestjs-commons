import { describe, expect, it } from "vitest";

import { compileMessage } from "./formatter.js";

describe("compileMessage", () => {
	it("renders tags as text", () => {
		expect(
			compileMessage("Hello <b>{name}</b>", "en").format({ name: "Ada" }),
		).toBe("Hello <b>Ada</b>");
	});
});
