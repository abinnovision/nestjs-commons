import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { z } from "zod";

import {
	createDurableTaskCtx,
	createDurableWorkflowCtx,
	createTaskCtx,
	createWorkflowCtx,
	isDurableCtx,
} from "./factory.js";
import { defineEvent } from "../../events/index.js";
import { EventPayloadMalformedException } from "../../exceptions/index.js";

import type {
	BaseCtx,
	DurableTaskCtx,
	DurableWorkflowCtx,
	HostTriggerConfig,
	TaskCtx,
	WorkflowCtx,
} from "./types.js";
import type {
	DurableTestTask,
	DurableTestWorkflow,
} from "../../__fixtures__/test-hosts.js";
import type { AnyEventDefinition } from "../../events/index.js";
import type { Context, DurableContext } from "@hatchet-dev/typescript-sdk";

const createMockSdkContext = <I>(input?: I) => {
	const mock = mockDeep<Context<I, any>>();
	Object.defineProperty(mock, "input", { value: input, writable: true });

	return mock;
};

const createMockDurableContext = <I>(
	input?: I,
	{ invocationCount = 1 } = {},
) => {
	const mock = mockDeep<DurableContext<I, any>>();
	Object.defineProperty(mock, "input", { value: input, writable: true });
	Object.defineProperty(mock, "invocationCount", { value: invocationCount });

	return mock;
};

const userCreated = defineEvent(
	"user:created",
	z.object({ userId: z.string() }),
);

const defaultHostConfig: HostTriggerConfig = {
	onEvents: [],
	onCrons: [],
};

describe("factory.ts", () => {
	describe("createTaskCtx()", () => {
		it("returns context with input from SDK context", () => {
			const input = { data: "test" };
			const fromSDK = createMockSdkContext(input);

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "run",
				input,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.input).toBe(input);
		});

		it("uses validated input when provided", () => {
			const rawInput = { data: "raw" };
			const validatedInput = { data: "validated" };
			const fromSDK = createMockSdkContext(rawInput);

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: validatedInput,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.input).toBe(validatedInput);
		});

		it("includes fromSDK reference", () => {
			const fromSDK = createMockSdkContext({ data: "test" });

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.fromSDK).toBe(fromSDK);
		});

		it("includes run function", () => {
			const fromSDK = createMockSdkContext({ data: "test" });

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(typeof ctx.run).toBe("function");
		});

		it("includes triggerSource", () => {
			const fromSDK = createMockSdkContext({ data: "test" });

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "cron",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.triggerSource).toBe("cron");
		});
	});

	describe("createWorkflowCtx()", () => {
		it("returns context with input from SDK context", () => {
			const input = { id: "123" };
			const fromSDK = createMockSdkContext(input);

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.input).toBe(input);
		});

		it("uses validated input when provided", () => {
			const rawInput = { id: "raw" };
			const validatedInput = { id: "validated" };
			const fromSDK = createMockSdkContext(rawInput);

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: validatedInput,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.input).toBe(validatedInput);
		});

		it("includes fromSDK reference", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.fromSDK).toBe(fromSDK);
		});

		it("includes run function", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(typeof ctx.run).toBe("function");
		});

		it("includes parent function", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(typeof ctx.parent).toBe("function");
		});

		it("includes triggerSource", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "event",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.triggerSource).toBe("event");
		});

		describe("parent()", () => {
			it("calls SDK parentOutput with method name", async () => {
				const fromSDK = createMockSdkContext({ id: "123" });
				fromSDK.parentOutput.mockResolvedValueOnce({ result: "parent-output" });

				const ctx = createWorkflowCtx({
					fromSDK,
					triggerSource: "run",
					input: fromSDK.input,
					hostConfig: defaultHostConfig,
				});

				// Create a named function to simulate a task method
				function step1() {}

				const result = await ctx.parent(step1 as any);

				expect(fromSDK.parentOutput).toHaveBeenCalledWith("step1");
				expect(result).toEqual({ result: "parent-output" });
			});
		});
	});

	describe("trigger guard methods", () => {
		describe("isRun()", () => {
			it("returns true for run trigger", () => {
				const fromSDK = createMockSdkContext({ data: "test" });
				const ctx = createTaskCtx({
					fromSDK,
					triggerSource: "run",
					input: fromSDK.input,
					hostConfig: defaultHostConfig,
				});

				expect(ctx.isRun()).toBe(true);
				expect(ctx.isEvent()).toBe(false);
				expect(ctx.isCron()).toBe(false);
			});
		});

		describe("isEvent()", () => {
			it("returns true for event trigger", () => {
				const fromSDK = createMockSdkContext({ data: "test" });
				const ctx = createTaskCtx({
					fromSDK,
					triggerSource: "event",
					input: fromSDK.input,
					hostConfig: defaultHostConfig,
				});

				expect(ctx.isRun()).toBe(false);
				expect(ctx.isEvent()).toBe(true);
				expect(ctx.isCron()).toBe(false);
			});

			it("returns false for non-event trigger when passed eventDef", () => {
				const fromSDK = createMockSdkContext({ data: "test" });
				const ctx = createTaskCtx({
					fromSDK,
					triggerSource: "run",
					input: fromSDK.input,
					hostConfig: defaultHostConfig,
				});

				const mockEventDef = {
					isCtx: vi.fn().mockReturnValue(true),
				} as unknown as AnyEventDefinition;

				expect(ctx.isEvent(mockEventDef)).toBe(false);
				expect(mockEventDef.isCtx).not.toHaveBeenCalled();
			});

			it("delegates to eventDef.isCtx() when event trigger and eventDef provided", () => {
				const input = { eventType: "user:created", userId: "123" };
				const fromSDK = createMockSdkContext(input);
				const ctx = createTaskCtx({
					fromSDK,
					triggerSource: "event",
					input,
					hostConfig: defaultHostConfig,
				});

				const mockEventDef = {
					isCtx: vi.fn().mockReturnValue(true),
				} as unknown as AnyEventDefinition;

				expect(ctx.isEvent(mockEventDef)).toBe(true);
				expect(mockEventDef.isCtx).toHaveBeenCalledWith({ input });
			});

			it("returns false when eventDef.isCtx() returns false", () => {
				const input = { eventType: "other:event" };
				const fromSDK = createMockSdkContext(input);
				const ctx = createTaskCtx({
					fromSDK,
					triggerSource: "event",
					input,
					hostConfig: defaultHostConfig,
				});

				const mockEventDef = {
					isCtx: vi.fn().mockReturnValue(false),
				} as unknown as AnyEventDefinition;

				expect(ctx.isEvent(mockEventDef)).toBe(false);
				expect(mockEventDef.isCtx).toHaveBeenCalledWith({ input });
			});
		});

		describe("isCron()", () => {
			it("returns true for cron trigger", () => {
				const fromSDK = createMockSdkContext({ data: "test" });
				const ctx = createTaskCtx({
					fromSDK,
					triggerSource: "cron",
					input: fromSDK.input,
					hostConfig: defaultHostConfig,
				});

				expect(ctx.isRun()).toBe(false);
				expect(ctx.isEvent()).toBe(false);
				expect(ctx.isCron()).toBe(true);
			});
		});

		describe("hostConfig", () => {
			it("includes hostConfig in context", () => {
				const fromSDK = createMockSdkContext({ data: "test" });
				const hostConfig: HostTriggerConfig = {
					onEvents: ["user:created"],
					onCrons: ["0 0 * * *"],
				};

				const ctx = createTaskCtx({
					fromSDK,
					triggerSource: "run",
					input: fromSDK.input,
					hostConfig,
				});

				expect(ctx.hostConfig).toBe(hostConfig);
				expect(ctx.hostConfig.onEvents).toEqual(["user:created"]);
				expect(ctx.hostConfig.onCrons).toEqual(["0 0 * * *"]);
			});
		});
	});

	describe("createDurableTaskCtx()", () => {
		const createCtx = (fromSDK: ReturnType<typeof createMockDurableContext>) =>
			createDurableTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

		it("includes the task context properties", () => {
			const fromSDK = createMockDurableContext({ data: "test" });

			const ctx = createCtx(fromSDK);

			expect(ctx.input).toEqual({ data: "test" });
			expect(ctx.fromSDK).toBe(fromSDK);
			expect(ctx.isRun()).toBe(true);
		});

		it("forwards invocationCount and derives isReplay", () => {
			expect(createCtx(createMockDurableContext({}))).toMatchObject({
				invocationCount: 1,
				isReplay: false,
			});
			expect(
				createCtx(createMockDurableContext({}, { invocationCount: 3 })),
			).toMatchObject({ invocationCount: 3, isReplay: true });
		});

		it("forwards sleepFor, sleepUntil, waitFor and now", async () => {
			const fromSDK = createMockDurableContext({});
			const date = new Date("2026-01-01T00:00:00Z");
			fromSDK.sleepFor.mockResolvedValueOnce({ durationMs: 1000 });
			fromSDK.sleepUntil.mockResolvedValueOnce({ durationMs: 0 });
			fromSDK.waitFor.mockResolvedValueOnce({ key: "value" });
			fromSDK.now.mockResolvedValueOnce(date);

			const ctx = createCtx(fromSDK);

			await expect(ctx.sleepFor("1s")).resolves.toEqual({ durationMs: 1000 });
			await expect(ctx.sleepUntil(date)).resolves.toEqual({ durationMs: 0 });
			await expect(ctx.waitFor({ eventKey: "key" })).resolves.toEqual({
				key: "value",
			});
			await expect(ctx.now()).resolves.toBe(date);
			expect(fromSDK.sleepFor).toHaveBeenCalledWith("1s");
			expect(fromSDK.sleepUntil).toHaveBeenCalledWith(date);
			expect(fromSDK.waitFor).toHaveBeenCalledWith({ eventKey: "key" });
		});

		describe("waitForEvent()", () => {
			it("returns the raw payload for a string key", async () => {
				const fromSDK = createMockDurableContext({});
				fromSDK.waitForEvent.mockResolvedValueOnce({ any: "payload" });

				const ctx = createCtx(fromSDK);

				const payload = await ctx.waitForEvent("some:event", {
					expression: "true",
				});

				expectTypeOf(payload).toEqualTypeOf<Record<string, unknown>>();
				expect(payload).toEqual({ any: "payload" });
				expect(fromSDK.waitForEvent).toHaveBeenCalledWith(
					"some:event",
					"true",
					undefined,
					undefined,
					undefined,
					undefined,
				);
			});

			it("passes the event name and options for an event definition", async () => {
				const fromSDK = createMockDurableContext({});
				fromSDK.waitForEvent.mockResolvedValueOnce({ userId: "1" });

				const ctx = createCtx(fromSDK);

				await ctx.waitForEvent(userCreated, {
					expression: "input.userId == '1'",
					scope: "scope",
					lookbackWindow: "1m",
					label: "label",
				});

				expect(fromSDK.waitForEvent).toHaveBeenCalledWith(
					"user:created",
					"input.userId == '1'",
					undefined,
					"scope",
					"1m",
					"label",
				);
			});

			it("returns the validated payload for an event definition", async () => {
				const fromSDK = createMockDurableContext({});
				fromSDK.waitForEvent.mockResolvedValueOnce({
					userId: "1",
					extra: true,
				});

				const ctx = createCtx(fromSDK);

				const payload = await ctx.waitForEvent(userCreated);

				expectTypeOf(payload).toEqualTypeOf<{ userId: string }>();
				expect(payload).toEqual({ userId: "1" });
			});

			it("throws EventPayloadMalformedException for a malformed payload", async () => {
				const fromSDK = createMockDurableContext({});
				fromSDK.waitForEvent.mockResolvedValueOnce({ userId: 1 });

				const ctx = createCtx(fromSDK);

				await expect(ctx.waitForEvent(userCreated)).rejects.toBeInstanceOf(
					EventPayloadMalformedException,
				);
			});

			it("throws EventPayloadMalformedException for an empty payload the schema rejects", async () => {
				const fromSDK = createMockDurableContext({});
				fromSDK.waitForEvent.mockResolvedValueOnce({});

				const ctx = createCtx(fromSDK);

				await expect(ctx.waitForEvent(userCreated)).rejects.toBeInstanceOf(
					EventPayloadMalformedException,
				);
			});
		});
	});

	describe("createDurableWorkflowCtx()", () => {
		it("includes the workflow context and durable members", () => {
			const fromSDK = createMockDurableContext(
				{ id: "1" },
				{ invocationCount: 2 },
			);

			const ctx = createDurableWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
				hostConfig: defaultHostConfig,
			});

			expect(ctx.fromSDK).toBe(fromSDK);
			expect(typeof ctx.parent).toBe("function");
			expect(ctx.invocationCount).toBe(2);
			expect(ctx.isReplay).toBe(true);
		});
	});

	describe("isDurableCtx()", () => {
		it("returns true for a durable context", () => {
			const fromSDK = createMockDurableContext({});
			const ctx: BaseCtx<any> = createDurableTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: {},
				hostConfig: defaultHostConfig,
			});

			expect(isDurableCtx(ctx)).toBe(true);
		});

		it("returns false for a non-durable context", () => {
			const fromSDK = createMockSdkContext({});
			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: {},
				hostConfig: defaultHostConfig,
			});

			expect(isDurableCtx(ctx)).toBe(false);
		});
	});

	describe("durable ctx types", () => {
		it("exposes durable members only on durable contexts", () => {
			expectTypeOf<DurableTaskCtx<DurableTestTask>>().toHaveProperty(
				"invocationCount",
			);
			expectTypeOf<TaskCtx<DurableTestTask>>().not.toHaveProperty(
				"invocationCount",
			);
			expectTypeOf<DurableTaskCtx<DurableTestTask>["fromSDK"]>().toExtend<
				DurableContext<{ data: string }>
			>();
		});

		it("keeps durable contexts assignable to the base contexts", () => {
			expectTypeOf<DurableWorkflowCtx<DurableTestWorkflow>>().toExtend<
				WorkflowCtx<DurableTestWorkflow>
			>();
			expectTypeOf<DurableWorkflowCtx<DurableTestWorkflow>>().toExtend<
				BaseCtx<any>
			>();
			expectTypeOf<DurableTaskCtx<DurableTestTask>>().toExtend<
				TaskCtx<DurableTestTask>
			>();
		});
	});
});
