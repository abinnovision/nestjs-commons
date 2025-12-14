import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

// eslint-disable-next-line vitest/no-mocks-import
import { createMockHatchetClient } from "../__mocks__/hatchet-client.mock";
import { defineEvent, EVENT_MARKER } from "../events";
import { Client } from "./client";

describe("client/client.ts", () => {
	const TestEvent = defineEvent(
		"test:event",
		z.object({
			id: z.string(),
			value: z.number(),
		}),
	);

	let mockHatchetClient: ReturnType<typeof createMockHatchetClient>;
	let client: Client;

	beforeEach(() => {
		mockHatchetClient = createMockHatchetClient();
		// Set up default return values for methods that return nested objects
		mockHatchetClient.events.bulkPush.mockResolvedValue({ events: [] });
		client = new Client(mockHatchetClient);
	});

	describe("sdk", () => {
		it("returns the underlying HatchetClient", () => {
			expect(client.sdk).toBe(mockHatchetClient);
		});
	});

	describe("emit()", () => {
		it("calls SDK events.push with event name", async () => {
			await client.emit(TestEvent, { id: "123", value: 42 });

			expect(mockHatchetClient.events.push).toHaveBeenCalledWith(
				"test:event",
				expect.any(Object),
				undefined,
			);
		});

		it("injects event marker into payload", async () => {
			await client.emit(TestEvent, { id: "123", value: 42 });

			expect(mockHatchetClient.events.push).toHaveBeenCalledWith(
				"test:event",
				expect.objectContaining({
					id: "123",
					value: 42,
					[EVENT_MARKER]: "test:event",
				}),
				undefined,
			);
		});

		it("passes options to SDK", async () => {
			const options = { additionalMetadata: { key: "value" } };

			await client.emit(TestEvent, { id: "123", value: 42 }, options);

			expect(mockHatchetClient.events.push).toHaveBeenCalledWith(
				"test:event",
				expect.any(Object),
				options,
			);
		});

		it("returns the emitted event", async () => {
			const mockEvent = { eventId: "event-123" };
			mockHatchetClient.events.push.mockResolvedValueOnce(mockEvent as any);

			const result = await client.emit(TestEvent, { id: "123", value: 42 });

			expect(result).toBe(mockEvent);
		});
	});

	describe("emitBulk()", () => {
		it("returns empty array for empty inputs", async () => {
			const result = await client.emitBulk(TestEvent, []);

			expect(result).toEqual([]);
			expect(mockHatchetClient.events.bulkPush).not.toHaveBeenCalled();
		});

		it("calls SDK events.bulkPush with event name", async () => {
			await client.emitBulk(TestEvent, [
				{ id: "1", value: 10 },
				{ id: "2", value: 20 },
			]);

			expect(mockHatchetClient.events.bulkPush).toHaveBeenCalledWith(
				"test:event",
				expect.any(Array),
				undefined,
			);
		});

		it("injects event marker into all payloads", async () => {
			await client.emitBulk(TestEvent, [
				{ id: "1", value: 10 },
				{ id: "2", value: 20 },
			]);

			expect(mockHatchetClient.events.bulkPush).toHaveBeenCalledWith(
				"test:event",
				[
					{ payload: { id: "1", value: 10, [EVENT_MARKER]: "test:event" } },
					{ payload: { id: "2", value: 20, [EVENT_MARKER]: "test:event" } },
				],
				undefined,
			);
		});

		it("passes options to SDK", async () => {
			const options = { additionalMetadata: { key: "value" } };

			await client.emitBulk(TestEvent, [{ id: "1", value: 10 }], options);

			expect(mockHatchetClient.events.bulkPush).toHaveBeenCalledWith(
				"test:event",
				expect.any(Array),
				options,
			);
		});

		it("returns emitted events", async () => {
			const mockEvents = [{ eventId: "1" }, { eventId: "2" }];
			mockHatchetClient.events.bulkPush.mockResolvedValueOnce({
				events: mockEvents as any,
			});

			const result = await client.emitBulk(TestEvent, [
				{ id: "1", value: 10 },
				{ id: "2", value: 20 },
			]);

			expect(result).toEqual(mockEvents);
		});
	});

	describe("run", () => {
		it("is defined as a function", () => {
			expect(typeof client.run).toBe("function");
		});
	});
});
