import { describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { createTaskCtx, createWorkflowCtx } from "./context-factory";

import type { HostTriggerConfig } from "./context";
import type { AnyEventDefinition } from "../events";
import type { Context } from "@hatchet-dev/typescript-sdk";

const createMockSdkContext = <I>(input?: I) => {
	const mock = mockDeep<Context<I, any>>();
	Object.defineProperty(mock, "input", { value: input, writable: true });
	return mock;
};

const defaultHostConfig: HostTriggerConfig = {
	onEvents: [],
	onCrons: [],
};

describe("context-factory.ts", () => {
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
});
