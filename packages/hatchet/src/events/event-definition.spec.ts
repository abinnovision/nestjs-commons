import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
	EVENT_MARKER,
	HatchetEventDefinition,
	hatchetEvent,
} from "./event-definition";

const testSchema = z.object({
	userId: z.string(),
	email: z.string().email(),
});

describe("hatchetEvent()", () => {
	it("creates definition with correct name", () => {
		const event = hatchetEvent("user:created", testSchema);

		expect(event.name).toBe("user:created");
	});

	it("creates definition with correct schema", () => {
		const event = hatchetEvent("user:created", testSchema);

		expect(event.schema).toBe(testSchema);
	});

	it("creates HatchetEventDefinition instance", () => {
		const event = hatchetEvent("user:created", testSchema);

		expect(event).toBeInstanceOf(HatchetEventDefinition);
	});
});

describe("#__types", () => {
	it("throws when accessed at runtime", () => {
		const event = hatchetEvent("user:created", testSchema);

		expect(() => event.__types).toThrow(
			"__types is a phantom property for type inference only",
		);
	});
});

describe("#isCtx()", () => {
	const event = hatchetEvent("user:created", testSchema);

	it("returns true when context has matching event marker and valid payload", () => {
		const ctx = {
			input: {
				userId: "123",
				email: "test@example.com",
				[EVENT_MARKER]: "user:created",
			},
		};

		expect(event.isCtx(ctx)).toBe(true);
	});

	it("returns false when context input is not an object", () => {
		const ctx = { input: "not an object" };

		expect(event.isCtx(ctx)).toBe(false);
	});

	it("returns false when context input is null", () => {
		const ctx = { input: null };

		expect(event.isCtx(ctx)).toBe(false);
	});

	it("returns false when context has no event marker", () => {
		const ctx = {
			input: { userId: "123", email: "test@example.com" },
		};

		expect(event.isCtx(ctx)).toBe(false);
	});

	it("returns false when event marker does not match", () => {
		const ctx = {
			input: {
				userId: "123",
				email: "test@example.com",
				[EVENT_MARKER]: "order:placed",
			},
		};

		expect(event.isCtx(ctx)).toBe(false);
	});

	it("throws when payload fails schema validation", () => {
		const ctx = {
			input: {
				userId: "123",
				email: "not-an-email",
				[EVENT_MARKER]: "user:created",
			},
		};

		expect(() => event.isCtx(ctx)).toThrow(/payload is malformed/);
	});

	it("throws when required field is missing", () => {
		const ctx = {
			input: {
				userId: "123",
				[EVENT_MARKER]: "user:created",
			},
		};

		expect(() => event.isCtx(ctx)).toThrow(/payload is malformed/);
	});
});
