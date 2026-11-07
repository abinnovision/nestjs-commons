import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { z } from "zod";

import { Client } from "./client.js";
import { TestTask } from "../__fixtures__/test-hosts.js";
import { EVENT_MARKER } from "../events/event-definition.js";
import { defineEvent } from "../events/index.js";
import { ClientInterceptor } from "../interceptor/index.js";
import { ClientInterceptorRegistration } from "../internal/registrations.js";
import { taskRef } from "../references/index.js";

import type {
	EmitCtx,
	EmitOptions,
	RunCtx,
	RunOptions,
} from "../interceptor/index.js";
import type { HatchetClient } from "@hatchet-dev/typescript-sdk";
import type { Type } from "@nestjs/common";
import type { ModuleRef } from "@nestjs/core";
import type { DeepMockProxy } from "vitest-mock-extended";

describe("client/client.ts", () => {
	const TestEvent = defineEvent(
		"test:event",
		z.object({
			id: z.string(),
			value: z.number(),
		}),
	);

	let mockHatchetClient: DeepMockProxy<HatchetClient>;
	let client: Client;

	beforeEach(() => {
		mockHatchetClient = mockDeep<HatchetClient>();

		// Set up default return values for methods that return nested objects
		mockHatchetClient.events.bulkPush.mockResolvedValue({ events: [] });
		client = new Client(mockHatchetClient);
	});

	describe("sdk", () => {
		it("returns the underlying HatchetClient", () => {
			expect(client.sdk).toBe(mockHatchetClient);
		});
	});

	describe("emit() — single input", () => {
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

	describe("emit() — array input", () => {
		it("returns empty array for empty inputs", async () => {
			const result = await client.emit(TestEvent, []);

			expect(result).toEqual([]);
			expect(mockHatchetClient.events.bulkPush).not.toHaveBeenCalled();
		});

		it("calls SDK events.bulkPush with event name", async () => {
			await client.emit(TestEvent, [
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
			await client.emit(TestEvent, [
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

			await client.emit(TestEvent, [{ id: "1", value: 10 }], options);

			expect(mockHatchetClient.events.bulkPush).toHaveBeenCalledWith(
				"test:event",
				expect.any(Array),
				options,
			);
		});

		it("propagates options.priority and options.scope onto each input", async () => {
			const options = {
				additionalMetadata: { tenant: "acme" },
				priority: 5,
				scope: "tenant-acme",
			};

			await client.emit(
				TestEvent,
				[
					{ id: "1", value: 10 },
					{ id: "2", value: 20 },
				],
				options,
			);

			expect(mockHatchetClient.events.bulkPush).toHaveBeenCalledWith(
				"test:event",
				[
					{
						payload: { id: "1", value: 10, [EVENT_MARKER]: "test:event" },
						additionalMetadata: options.additionalMetadata,
						priority: options.priority,
						scope: options.scope,
					},
					{
						payload: { id: "2", value: 20, [EVENT_MARKER]: "test:event" },
						additionalMetadata: options.additionalMetadata,
						priority: options.priority,
						scope: options.scope,
					},
				],
				options,
			);
		});

		it("returns emitted events", async () => {
			const mockEvents = [{ eventId: "1" }, { eventId: "2" }];
			mockHatchetClient.events.bulkPush.mockResolvedValueOnce({
				events: mockEvents as any,
			});

			const result = await client.emit(TestEvent, [
				{ id: "1", value: 10 },
				{ id: "2", value: 20 },
			]);

			expect(result).toEqual(mockEvents);
		});
	});

	describe("emitBulk() — deprecated alias", () => {
		it("forwards array inputs to SDK events.bulkPush", async () => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- intentionally exercises the deprecated alias
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

		it("returns empty array for empty inputs without calling the SDK", async () => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- intentionally exercises the deprecated alias
			const result = await client.emitBulk(TestEvent, []);

			expect(result).toEqual([]);
			expect(mockHatchetClient.events.bulkPush).not.toHaveBeenCalled();
		});
	});

	describe("run", () => {
		it("is defined as a function", () => {
			expect(typeof client.run).toBe("function");
		});
	});

	describe("emit() — interceptors", () => {
		const metadata = (key: string) => ({ additionalMetadata: { key } });

		class TagInterceptor extends ClientInterceptor {
			public readonly seen: EmitCtx[] = [];

			public constructor(private readonly tag?: string) {
				super();
			}

			public override interceptEmit(
				ctx: EmitCtx,
				next: (options?: EmitOptions) => Promise<unknown>,
			) {
				this.seen.push(ctx);

				return this.tag === undefined
					? next()
					: next({ ...ctx.options, ...metadata(this.tag) });
			}
		}

		class RunOnlyInterceptor extends ClientInterceptor {
			public override interceptRun(
				_ctx: RunCtx,
				next: (options?: RunOptions) => Promise<unknown>,
			) {
				return next();
			}
		}

		const createClient = (instances: ClientInterceptor[]) => {
			const map = new Map<unknown, ClientInterceptor>();
			const refs = instances.map((instance) => {
				const ref = instance.constructor as Type<ClientInterceptor>;
				map.set(ref, instance);

				return ref;
			});
			const get = vi.fn((ref: unknown) => map.get(ref));

			return {
				get,
				client: new Client(
					mockHatchetClient,
					{ get } as unknown as ModuleRef,
					new ClientInterceptorRegistration(refs),
				),
			};
		};

		it("invokes interceptEmit once for a single emit with the caller's options", async () => {
			const interceptor = new TagInterceptor();
			const { client } = createClient([interceptor]);
			const options = metadata("caller");

			await client.emit(TestEvent, { id: "1", value: 1 }, options);

			expect(interceptor.seen).toHaveLength(1);
			expect(interceptor.seen[0]?.event).toBe(TestEvent);
			expect(interceptor.seen[0]?.input).toEqual({ id: "1", value: 1 });
			expect(interceptor.seen[0]?.options).toBe(options);
		});

		it("forwards options passed to next() to events.push", async () => {
			const { client } = createClient([new TagInterceptor("changed")]);

			await client.emit(TestEvent, { id: "1", value: 1 }, metadata("caller"));

			expect(mockHatchetClient.events.push).toHaveBeenCalledWith(
				"test:event",
				expect.any(Object),
				metadata("changed"),
			);
		});

		it("invokes interceptEmit once per bulk call and applies the final options per event and as the bulkPush options", async () => {
			const interceptor = new TagInterceptor("changed");
			const { client } = createClient([interceptor]);

			await client.emit(
				TestEvent,
				[
					{ id: "1", value: 1 },
					{ id: "2", value: 2 },
				],
				metadata("caller"),
			);

			expect(interceptor.seen).toHaveLength(1);
			expect(mockHatchetClient.events.bulkPush).toHaveBeenCalledWith(
				"test:event",
				[
					expect.objectContaining(metadata("changed")),
					expect.objectContaining(metadata("changed")),
				],
				metadata("changed"),
			);
		});

		it("does not invoke interceptors for an empty array", async () => {
			const interceptor = new TagInterceptor();
			const { client } = createClient([interceptor]);

			await client.emit(TestEvent, []);

			expect(interceptor.seen).toHaveLength(0);
			expect(mockHatchetClient.events.bulkPush).not.toHaveBeenCalled();
		});

		it("skips interceptors that do not implement interceptEmit", async () => {
			const { client } = createClient([new RunOnlyInterceptor()]);

			await client.emit(TestEvent, { id: "1", value: 1 });

			expect(mockHatchetClient.events.push).toHaveBeenCalledTimes(1);
		});

		it("chains multiple interceptors with the first as outermost", async () => {
			class Outer extends TagInterceptor {}
			class Inner extends TagInterceptor {}
			const outer = new Outer("outer");
			const inner = new Inner("inner");
			const { client } = createClient([outer, inner]);

			await client.emit(TestEvent, { id: "1", value: 1 });

			expect(inner.seen[0]?.options).toEqual(metadata("outer"));
			expect(mockHatchetClient.events.push).toHaveBeenCalledWith(
				"test:event",
				expect.any(Object),
				metadata("inner"),
			);
		});

		it("routes emitBulk through interceptors", async () => {
			const interceptor = new TagInterceptor();
			const { client } = createClient([interceptor]);

			// eslint-disable-next-line @typescript-eslint/no-deprecated -- intentionally exercises the deprecated alias
			await client.emitBulk(TestEvent, [{ id: "1", value: 1 }]);

			expect(interceptor.seen).toHaveLength(1);
		});

		it("propagates an interceptor error unchanged", async () => {
			const error = new Error("boom");
			class Failing extends ClientInterceptor {
				public override interceptEmit(): Promise<unknown> {
					return Promise.reject(error);
				}
			}
			const { client } = createClient([new Failing()]);

			await expect(client.emit(TestEvent, { id: "1", value: 1 })).rejects.toBe(
				error,
			);
		});

		it("resolves interceptors via moduleRef.get only once across multiple calls", async () => {
			const { client, get } = createClient([new TagInterceptor()]);

			await client.emit(TestEvent, { id: "1", value: 1 });
			await client.emit(TestEvent, { id: "2", value: 2 });

			expect(get).toHaveBeenCalledTimes(1);
		});

		it("resolves interceptors in onApplicationBootstrap", () => {
			const { client, get } = createClient([new TagInterceptor()]);

			client.onApplicationBootstrap();

			expect(get).toHaveBeenCalledTimes(1);
		});
	});

	describe("run — interceptors", () => {
		class RecordingInterceptor extends ClientInterceptor {
			public readonly seen: RunCtx[] = [];
			public readonly completed = vi.fn();

			public constructor(private readonly replace?: RunOptions) {
				super();
			}

			public override async interceptRun(
				ctx: RunCtx,
				next: (options?: RunOptions) => Promise<unknown>,
			) {
				this.seen.push(ctx);
				const result = await next(this.replace);
				this.completed();

				return result;
			}
		}

		class EmitOnlyInterceptor extends ClientInterceptor {
			public override interceptEmit(
				_ctx: EmitCtx,
				next: (options?: EmitOptions) => Promise<unknown>,
			) {
				return next();
			}
		}

		const ref = taskRef(TestTask);
		const input = { data: "test" };

		const createClient = (interceptor: ClientInterceptor) => {
			const ctor = interceptor.constructor as Type<ClientInterceptor>;
			const moduleRef = {
				get: (token: unknown) => (token === ctor ? interceptor : undefined),
			} as unknown as ModuleRef;

			return new Client(
				mockHatchetClient,
				moduleRef,
				new ClientInterceptorRegistration([ctor]),
			);
		};

		const runRefWith = (output: Promise<unknown>) => ({ output }) as any;

		it("invokes interceptRun once per call with the caller's options", async () => {
			const interceptor = new RecordingInterceptor();
			const client = createClient(interceptor);
			mockHatchetClient.runNoWait.mockResolvedValue(
				runRefWith(Promise.resolve("out")),
			);
			const options = { additionalMetadata: { key: "caller" } };

			await client.run(ref, input, options);

			expect(interceptor.seen).toHaveLength(1);
			expect(interceptor.seen[0]?.ref).toBe(ref);
			expect(interceptor.seen[0]?.name).toBe("test-task");
			expect(interceptor.seen[0]?.input).toBe(input);
			expect(interceptor.seen[0]?.options).toBe(options);
		});

		it("invokes interceptRun once for array input", async () => {
			const interceptor = new RecordingInterceptor();
			const client = createClient(interceptor);
			mockHatchetClient.runNoWait.mockResolvedValue(
				runRefWith(Promise.resolve("out")),
			);

			await client.run(ref, [input, input]);

			expect(interceptor.seen).toHaveLength(1);
			expect(mockHatchetClient.runNoWait).toHaveBeenCalledTimes(2);
		});

		it("forwards options passed to next() to runNoWait", async () => {
			const replacement = { additionalMetadata: { key: "changed" } };
			const client = createClient(new RecordingInterceptor(replacement));
			mockHatchetClient.runNoWait.mockResolvedValue(
				runRefWith(Promise.resolve("out")),
			);

			await client.run(ref, input, { additionalMetadata: { key: "caller" } });

			expect(mockHatchetClient.runNoWait).toHaveBeenCalledWith(
				"test-task",
				input,
				replacement,
			);
		});

		it("ignores wait set by an interceptor and keeps the caller's return shape", async () => {
			const replacement: RunOptions & { wait: boolean } = { wait: true };
			const client = createClient(new RecordingInterceptor(replacement));
			const runRef = runRefWith(Promise.resolve("out"));
			mockHatchetClient.runNoWait.mockResolvedValue(runRef);

			const result = await client.run(ref, input, { wait: false });

			expect(result).toBe(runRef);
		});

		it("passes the caller's options object to runNoWait unchanged when no interceptor replaces it", async () => {
			const client = createClient(new RecordingInterceptor());
			mockHatchetClient.runNoWait.mockResolvedValue(
				runRefWith(Promise.resolve("out")),
			);
			const options = { additionalMetadata: { key: "caller" } };

			await client.run(ref, input, options);

			expect(mockHatchetClient.runNoWait.mock.calls[0]?.[2]).toBe(options);
		});

		it("skips interceptors that do not implement interceptRun", async () => {
			const client = createClient(new EmitOnlyInterceptor());
			mockHatchetClient.runNoWait.mockResolvedValue(
				runRefWith(Promise.resolve("out")),
			);

			await expect(client.run(ref, input)).resolves.toBe("out");
		});

		it("wraps the awaited output when wait is true", async () => {
			const interceptor = new RecordingInterceptor();
			const client = createClient(interceptor);
			let resolveOutput!: (value: unknown) => void;
			mockHatchetClient.runNoWait.mockResolvedValue(
				runRefWith(
					new Promise((resolve) => {
						resolveOutput = resolve;
					}),
				),
			);

			const pending = client.run(ref, input);
			await vi.waitFor(() => {
				expect(mockHatchetClient.runNoWait).toHaveBeenCalled();
			});
			expect(interceptor.completed).not.toHaveBeenCalled();

			resolveOutput("out");
			await pending;

			expect(interceptor.completed).toHaveBeenCalledTimes(1);
		});
	});
});
