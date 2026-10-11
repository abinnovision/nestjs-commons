import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import {
	createHostRunForAdmin,
	createHostRunForContext,
} from "./adapter-factory.js";
import { TestTask, TestWorkflow } from "../../__fixtures__/test-hosts.js";
import { taskRef, workflowRef } from "../../references/index.js";

import type { Context, HatchetClient } from "@hatchet-dev/typescript-sdk";

const createMockHatchetClient = () => mockDeep<HatchetClient>();

const createMockSdkContext = <I>(input?: I) => {
	const mock = mockDeep<Context<I, any>>();
	Object.defineProperty(mock, "input", { value: input, writable: true });

	return mock;
};

/**
 * Creates a minimal mock WorkflowRunRef for testing.
 */

const createMockRunRef = (output: unknown): any => ({
	output: Promise.resolve(output),
});

describe("createHostRunForContext()", () => {
	let sdkCtx: ReturnType<typeof createMockSdkContext>;
	let runFn: ReturnType<typeof createHostRunForContext>;

	beforeEach(() => {
		sdkCtx = createMockSdkContext({ data: "test" });
		runFn = createHostRunForContext(sdkCtx);
	});

	it("calls SDK runNoWaitChild with workflow name", async () => {
		const ref = taskRef(TestTask);
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(
			createMockRunRef({ result: "test" }),
		);

		await runFn(ref, { data: "test" });

		expect(sdkCtx.runNoWaitChild).toHaveBeenCalledWith(
			"test-task",
			{ data: "test" },
			undefined,
		);
	});

	it("passes childKey to the SDK as key", async () => {
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(
			createMockRunRef({ result: "test" }),
		);

		await runFn(taskRef(TestTask), { data: "test" }, { childKey: "child-1" });

		expect(sdkCtx.runNoWaitChild).toHaveBeenCalledWith(
			"test-task",
			{ data: "test" },
			{ childKey: "child-1", key: "child-1" },
		);
	});

	it("waits for output by default", async () => {
		const ref = taskRef(TestTask);
		const expectedOutput = { result: "test" };
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(
			createMockRunRef(expectedOutput),
		);

		const result = await runFn(ref, { data: "test" });

		expect(result).toEqual(expectedOutput);
	});

	it("returns run ref when wait is false", async () => {
		const ref = taskRef(TestTask);
		const mockRunRef = createMockRunRef({ result: "test" });
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(mockRunRef);

		const result = await runFn(ref, { data: "test" }, { wait: false });

		expect(result).toBe(mockRunRef);
	});

	it("handles array inputs", async () => {
		const ref = taskRef(TestTask);
		sdkCtx.runNoWaitChild
			.mockResolvedValueOnce(createMockRunRef({ result: "a" }))
			.mockResolvedValueOnce(createMockRunRef({ result: "b" }));

		const result = await runFn(ref, [{ data: "a" }, { data: "b" }]);

		expect(sdkCtx.runNoWaitChild).toHaveBeenCalledTimes(2);
		expect(result).toEqual([{ result: "a" }, { result: "b" }]);
	});

	it("returns run refs for array inputs when wait is false", async () => {
		const ref = taskRef(TestTask);
		const mockRunRef1 = createMockRunRef({ result: "a" });
		const mockRunRef2 = createMockRunRef({ result: "b" });
		sdkCtx.runNoWaitChild
			.mockResolvedValueOnce(mockRunRef1)
			.mockResolvedValueOnce(mockRunRef2);

		const result = await runFn(ref, [{ data: "a" }, { data: "b" }], {
			wait: false,
		});

		expect(result).toEqual([mockRunRef1, mockRunRef2]);
	});

	it("sets the standalone task name on task run refs", async () => {
		const mockRunRef = createMockRunRef({ result: "test" });
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(mockRunRef);

		await runFn(taskRef(TestTask), { data: "test" });

		expect(mockRunRef._standaloneTaskName).toBe("test-task");
	});

	it("does not set the standalone task name on workflow run refs", async () => {
		const mockRunRef = createMockRunRef({ step1: {}, step2: {} });
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(mockRunRef);

		await runFn(workflowRef(TestWorkflow), { id: "1" });

		expect(mockRunRef._standaloneTaskName).toBeUndefined();
	});
});

describe("createHostRunForAdmin()", () => {
	let mockClient: ReturnType<typeof createMockHatchetClient>;
	let runFn: ReturnType<typeof createHostRunForAdmin>;

	beforeEach(() => {
		mockClient = createMockHatchetClient();
		runFn = createHostRunForAdmin(mockClient);
	});

	it("calls SDK runNoWait with workflow name", async () => {
		const ref = taskRef(TestTask);
		mockClient.runNoWait.mockResolvedValueOnce(
			createMockRunRef({ result: "test" }),
		);

		await runFn(ref, { data: "test" });

		expect(mockClient.runNoWait).toHaveBeenCalledWith(
			"test-task",
			{ data: "test" },
			{},
		);
	});

	it("waits for output by default", async () => {
		const ref = taskRef(TestTask);
		const expectedOutput = { result: "test" };
		mockClient.runNoWait.mockResolvedValueOnce(
			createMockRunRef(expectedOutput),
		);

		const result = await runFn(ref, { data: "test" });

		expect(result).toEqual(expectedOutput);
	});

	it("returns run ref when wait is false", async () => {
		const ref = taskRef(TestTask);
		const mockRunRef = createMockRunRef({ result: "test" });
		mockClient.runNoWait.mockResolvedValueOnce(mockRunRef);

		const result = await runFn(ref, { data: "test" }, { wait: false });

		expect(result).toBe(mockRunRef);
	});

	it("handles array inputs", async () => {
		const ref = taskRef(TestTask);
		mockClient.runNoWait
			.mockResolvedValueOnce(createMockRunRef({ result: "a" }))
			.mockResolvedValueOnce(createMockRunRef({ result: "b" }));

		const result = await runFn(ref, [{ data: "a" }, { data: "b" }]);

		expect(mockClient.runNoWait).toHaveBeenCalledTimes(2);
		expect(result).toEqual([{ result: "a" }, { result: "b" }]);
	});

	it("sets the standalone task name on task run refs for array inputs", async () => {
		const mockRunRef1 = createMockRunRef({ result: "a" });
		const mockRunRef2 = createMockRunRef({ result: "b" });
		mockClient.runNoWait
			.mockResolvedValueOnce(mockRunRef1)
			.mockResolvedValueOnce(mockRunRef2);

		await runFn(taskRef(TestTask), [{ data: "a" }, { data: "b" }]);

		expect(mockRunRef1._standaloneTaskName).toBe("test-task");
		expect(mockRunRef2._standaloneTaskName).toBe("test-task");
	});
});
