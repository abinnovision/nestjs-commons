import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
	defineEvent,
	EVENT_MARKER,
	EventDefinition,
} from "./event-definition.js";
import {
	EventPayloadMalformedException,
	HatchetException,
} from "../exceptions/index.js";

const testSchema = z.object({
	userId: z.string(),
	email: z.email(),
});

function captureThrow(fn: () => unknown): unknown {
	try {
		fn();
	} catch (err) {
		return err;
	}

	throw new Error("Expected function to throw");
}

describe("defineEvent()", () => {
	it("creates definition with correct name", () => {
		const event = defineEvent("user:created", testSchema);

		expect(event.name).toBe("user:created");
	});

	it("creates definition with correct schema", () => {
		const event = defineEvent("user:created", testSchema);

		expect(event.schema).toBe(testSchema);
	});

	it("creates EventDefinition instance", () => {
		const event = defineEvent("user:created", testSchema);

		expect(event).toBeInstanceOf(EventDefinition);
	});
});

describe("#__types", () => {
	it("throws when accessed at runtime", () => {
		const event = defineEvent("user:created", testSchema);

		expect(() => event.__types).toThrow(
			"__types is a phantom property for type inference only",
		);
	});
});

describe("#isCtx()", () => {
	const event = defineEvent("user:created", testSchema);

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

	it("throws EventPayloadMalformedException when payload fails schema validation", () => {
		const ctx = {
			input: {
				userId: "123",
				email: "not-an-email",
				[EVENT_MARKER]: "user:created",
			},
		};

		expect(() => event.isCtx(ctx)).toThrow(EventPayloadMalformedException);
	});

	it("throws EventPayloadMalformedException when required field is missing", () => {
		const ctx = {
			input: {
				userId: "123",
				[EVENT_MARKER]: "user:created",
			},
		};

		expect(() => event.isCtx(ctx)).toThrow(EventPayloadMalformedException);
	});

	it("exposes the event name and structured issues on the thrown exception", () => {
		const ctx = {
			input: {
				userId: "123",
				email: "not-an-email",
				[EVENT_MARKER]: "user:created",
			},
		};

		const exception = captureThrow(() =>
			event.isCtx(ctx),
		) as EventPayloadMalformedException;

		expect(exception).toBeInstanceOf(EventPayloadMalformedException);
		expect(exception).toBeInstanceOf(HatchetException);
		expect(exception.eventName).toBe("user:created");
		expect(exception.issues.length).toBeGreaterThan(0);
		expect(exception.issues[0]?.path).toBe("email");
		expect(exception.message).toContain(
			"Event 'user:created' payload is malformed",
		);
		expect(exception.message).toContain("email:");
		expect(exception.message).not.toContain("[{");
	});
});

describe("#cast()", () => {
	const event = defineEvent("user:created", testSchema);

	it("returns true for a valid object without the event marker", () => {
		const ctx = { input: { userId: "123", email: "test@example.com" } };

		expect(event.cast(ctx)).toBe(true);
	});

	it("returns false when context input is not an object", () => {
		const ctx = { input: "not an object" };

		expect(event.cast(ctx)).toBe(false);
	});

	it("returns false when context input is null", () => {
		const ctx = { input: null };

		expect(event.cast(ctx)).toBe(false);
	});

	it("throws EventPayloadMalformedException when payload fails schema validation", () => {
		const ctx = { input: { userId: "123", email: "not-an-email" } };

		expect(() => event.cast(ctx)).toThrow(EventPayloadMalformedException);
	});

	it("throws EventPayloadMalformedException when required field is missing", () => {
		const ctx = { input: { userId: "123" } };

		expect(() => event.cast(ctx)).toThrow(EventPayloadMalformedException);
	});

	it("exposes the event name and structured issues on the thrown exception", () => {
		const ctx = { input: { userId: "123" } };

		const exception = captureThrow(() =>
			event.cast(ctx),
		) as EventPayloadMalformedException;

		expect(exception).toBeInstanceOf(EventPayloadMalformedException);
		expect(exception.eventName).toBe("user:created");
		expect(exception.issues.length).toBeGreaterThan(0);
		expect(exception.issues[0]?.path).toBe("email");
	});

	it("returns true for payload that has the marker (marker is irrelevant to cast)", () => {
		const ctx = {
			input: {
				userId: "123",
				email: "test@example.com",
				[EVENT_MARKER]: "other:event",
			},
		};

		expect(event.cast(ctx)).toBe(true);
	});

	describe("contrast with isCtx()", () => {
		it("returns true for marker-free valid input where isCtx returns false", () => {
			const ctx = { input: { userId: "123", email: "test@example.com" } };

			expect(event.cast(ctx)).toBe(true);
			expect(event.isCtx(ctx)).toBe(false);
		});
	});
});
