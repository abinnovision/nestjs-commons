import { describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { createTaskCtx, createWorkflowCtx } from "./context-factory";

import type { Context } from "@hatchet-dev/typescript-sdk";

const createMockSdkContext = <I>(input?: I) => {
	const mock = mockDeep<Context<I, any>>();
	Object.defineProperty(mock, "input", { value: input, writable: true });
	return mock;
};

describe("context-factory.ts", () => {
	describe("createTaskCtx()", () => {
		it("returns context with input from SDK context", () => {
			const input = { data: "test" };
			const fromSDK = createMockSdkContext(input);

			const ctx = createTaskCtx({ fromSDK, triggerSource: "run", input });

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
			});

			expect(ctx.input).toBe(validatedInput);
		});

		it("includes fromSDK reference", () => {
			const fromSDK = createMockSdkContext({ data: "test" });

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
			});

			expect(ctx.fromSDK).toBe(fromSDK);
		});

		it("includes run function", () => {
			const fromSDK = createMockSdkContext({ data: "test" });

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
			});

			expect(typeof ctx.run).toBe("function");
		});

		it("includes triggerSource", () => {
			const fromSDK = createMockSdkContext({ data: "test" });

			const ctx = createTaskCtx({
				fromSDK,
				triggerSource: "cron",
				input: fromSDK.input,
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
			});

			expect(ctx.input).toBe(validatedInput);
		});

		it("includes fromSDK reference", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
			});

			expect(ctx.fromSDK).toBe(fromSDK);
		});

		it("includes run function", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
			});

			expect(typeof ctx.run).toBe("function");
		});

		it("includes parent function", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "run",
				input: fromSDK.input,
			});

			expect(typeof ctx.parent).toBe("function");
		});

		it("includes triggerSource", () => {
			const fromSDK = createMockSdkContext({ id: "123" });

			const ctx = createWorkflowCtx({
				fromSDK,
				triggerSource: "event",
				input: fromSDK.input,
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
				});

				// Create a named function to simulate a task method
				function step1() {}
				const result = await ctx.parent(step1 as any);

				expect(fromSDK.parentOutput).toHaveBeenCalledWith("step1");
				expect(result).toEqual({ result: "parent-output" });
			});
		});
	});
});
