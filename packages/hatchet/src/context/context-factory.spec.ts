import { describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { createTaskCtx, createWorkflowCtx } from "./context-factory";

import type { Context } from "@hatchet-dev/typescript-sdk";

const createMockSdkContext = <I>(input?: I) => {
	const mock = mockDeep<Context<I, any>>();
	Object.defineProperty(mock, "input", { value: input, writable: true });
	return mock;
};

describe("createTaskCtx()", () => {
	it("returns context with input from SDK context", () => {
		const input = { data: "test" };
		const sdkCtx = createMockSdkContext(input);

		const ctx = createTaskCtx(sdkCtx);

		expect(ctx.input).toBe(input);
	});

	it("uses validated input when provided", () => {
		const rawInput = { data: "raw" };
		const validatedInput = { data: "validated" };
		const sdkCtx = createMockSdkContext(rawInput);

		const ctx = createTaskCtx(sdkCtx, validatedInput);

		expect(ctx.input).toBe(validatedInput);
	});

	it("includes fromSDK reference", () => {
		const sdkCtx = createMockSdkContext({ data: "test" });

		const ctx = createTaskCtx(sdkCtx);

		expect(ctx.fromSDK).toBe(sdkCtx);
	});

	it("includes run function", () => {
		const sdkCtx = createMockSdkContext({ data: "test" });

		const ctx = createTaskCtx(sdkCtx);

		expect(typeof ctx.run).toBe("function");
	});
});

describe("createWorkflowCtx()", () => {
	it("returns context with input from SDK context", () => {
		const input = { id: "123" };
		const sdkCtx = createMockSdkContext(input);

		const ctx = createWorkflowCtx(sdkCtx);

		expect(ctx.input).toBe(input);
	});

	it("uses validated input when provided", () => {
		const rawInput = { id: "raw" };
		const validatedInput = { id: "validated" };
		const sdkCtx = createMockSdkContext(rawInput);

		const ctx = createWorkflowCtx(sdkCtx, validatedInput);

		expect(ctx.input).toBe(validatedInput);
	});

	it("includes fromSDK reference", () => {
		const sdkCtx = createMockSdkContext({ id: "123" });

		const ctx = createWorkflowCtx(sdkCtx);

		expect(ctx.fromSDK).toBe(sdkCtx);
	});

	it("includes run function", () => {
		const sdkCtx = createMockSdkContext({ id: "123" });

		const ctx = createWorkflowCtx(sdkCtx);

		expect(typeof ctx.run).toBe("function");
	});

	it("includes parent function", () => {
		const sdkCtx = createMockSdkContext({ id: "123" });

		const ctx = createWorkflowCtx(sdkCtx);

		expect(typeof ctx.parent).toBe("function");
	});

	describe("parent()", () => {
		it("calls SDK parentOutput with method name", async () => {
			const sdkCtx = createMockSdkContext({ id: "123" });
			sdkCtx.parentOutput.mockResolvedValueOnce({ result: "parent-output" });

			const ctx = createWorkflowCtx(sdkCtx);

			// Create a named function to simulate a task method
			function step1() {}
			const result = await ctx.parent(step1 as any);

			expect(sdkCtx.parentOutput).toHaveBeenCalledWith("step1");
			expect(result).toEqual({ result: "parent-output" });
		});
	});
});
