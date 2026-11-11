import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import {
	createHostRunForAdmin,
	createHostRunForContext,
	createHostRunForDurableContext,
} from "./adapter-factory.js";
import { TestTask, TestWorkflow } from "../../__fixtures__/test-hosts.js";
import {
	DurableEvictionNotSupportedException,
	DurableRunNoWaitException,
} from "../../exceptions/index.js";
import { taskRef, workflowRef } from "../../references/index.js";

import type { ClientInterceptor } from "../../interceptor/index.js";
import type {
	Context,
	DurableContext,
	HatchetClient,
} from "@hatchet-dev/typescript-sdk";

const createMockHatchetClient = () => mockDeep<HatchetClient>();

const createMockSdkContext = <I>(input?: I) => {
	const mock = mockDeep<Context<I, any>>();
	Object.defineProperty(mock, "input", { value: input, writable: true });

	return mock;
};

const createMockDurableContext = (supportsEviction = true) => {
	const mock = mockDeep<DurableContext<any, any>>();
	Object.defineProperty(mock, "supportsEviction", { value: supportsEviction });

	return mock;
};

/**
 * Creates a minimal mock WorkflowRunRef for testing.
 */

const createMockRunRef = (output: unknown): any => ({
	output: Promise.resolve(output),
});

/**
 * Builds the rejecting output lazily so no unhandled rejection fires early.
 */
const rejectingRunRef = (error: Error): any => ({
	get output() {
		return Promise.reject(error);
	},
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
		sdkCtx.bulkRunNoWaitChildren.mockResolvedValueOnce([
			createMockRunRef({ result: "a" }),
			createMockRunRef({ result: "b" }),
		]);

		const result = await runFn(ref, [{ data: "a" }, { data: "b" }]);

		expect(sdkCtx.bulkRunNoWaitChildren).toHaveBeenCalledTimes(1);
		expect(sdkCtx.bulkRunNoWaitChildren).toHaveBeenCalledWith([
			{ workflow: "test-task", input: { data: "a" }, options: {} },
			{ workflow: "test-task", input: { data: "b" }, options: {} },
		]);
		expect(sdkCtx.runNoWaitChild).not.toHaveBeenCalled();
		expect(result).toEqual([{ result: "a" }, { result: "b" }]);
	});

	it("returns run refs for array inputs when wait is false", async () => {
		const ref = taskRef(TestTask);
		const mockRunRef1 = createMockRunRef({ result: "a" });
		const mockRunRef2 = createMockRunRef({ result: "b" });
		sdkCtx.bulkRunNoWaitChildren.mockResolvedValueOnce([
			mockRunRef1,
			mockRunRef2,
		]);

		const result = await runFn(ref, [{ data: "a" }, { data: "b" }], {
			wait: false,
		});

		expect(result).toEqual([mockRunRef1, mockRunRef2]);
		expect((result as any[])[0]).toBe(mockRunRef1);
		expect((result as any[])[1]).toBe(mockRunRef2);
	});

	it("maps childKey to key for every child in array input", async () => {
		sdkCtx.bulkRunNoWaitChildren.mockResolvedValueOnce([
			createMockRunRef({ result: "a" }),
			createMockRunRef({ result: "b" }),
		]);

		await runFn(taskRef(TestTask), [{ data: "a" }, { data: "b" }], {
			childKey: "child-1",
		});

		const children = sdkCtx.bulkRunNoWaitChildren.mock.calls[0]![0];
		expect(children).toHaveLength(2);
		for (const child of children) {
			expect(child.options).toMatchObject({
				childKey: "child-1",
				key: "child-1",
			});
		}
	});

	it("sets the standalone task name on task run refs for array inputs", async () => {
		const mockRunRef1 = createMockRunRef({ result: "a" });
		const mockRunRef2 = createMockRunRef({ result: "b" });
		sdkCtx.bulkRunNoWaitChildren.mockResolvedValueOnce([
			mockRunRef1,
			mockRunRef2,
		]);

		await runFn(taskRef(TestTask), [{ data: "a" }, { data: "b" }]);

		expect(mockRunRef1._standaloneTaskName).toBe("test-task");
		expect(mockRunRef2._standaloneTaskName).toBe("test-task");
	});

	it("returns an empty array without calling the SDK for empty input", async () => {
		const result = await runFn(taskRef(TestTask), []);

		expect(result).toEqual([]);
		expect(sdkCtx.bulkRunNoWaitChildren).not.toHaveBeenCalled();
		expect(sdkCtx.runNoWaitChild).not.toHaveBeenCalled();
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
		mockClient.admin.runWorkflows.mockResolvedValueOnce([
			createMockRunRef({ result: "a" }),
			createMockRunRef({ result: "b" }),
		]);

		const result = await runFn(ref, [{ data: "a" }, { data: "b" }]);

		expect(mockClient.admin.runWorkflows).toHaveBeenCalledTimes(1);
		expect(mockClient.admin.runWorkflows).toHaveBeenCalledWith([
			{ workflowName: "test-task", input: { data: "a" }, options: {} },
			{ workflowName: "test-task", input: { data: "b" }, options: {} },
		]);
		expect(mockClient.runNoWait).not.toHaveBeenCalled();
		expect(result).toEqual([{ result: "a" }, { result: "b" }]);
	});

	it("returns run refs for array inputs when wait is false", async () => {
		const mockRunRef1 = createMockRunRef({ result: "a" });
		const mockRunRef2 = createMockRunRef({ result: "b" });
		mockClient.admin.runWorkflows.mockResolvedValueOnce([
			mockRunRef1,
			mockRunRef2,
		]);

		const result = await runFn(
			taskRef(TestTask),
			[{ data: "a" }, { data: "b" }],
			{ wait: false },
		);

		expect((result as any[])[0]).toBe(mockRunRef1);
		expect((result as any[])[1]).toBe(mockRunRef2);
	});

	it("sets the standalone task name on task run refs for array inputs", async () => {
		const mockRunRef1 = createMockRunRef({ result: "a" });
		const mockRunRef2 = createMockRunRef({ result: "b" });
		mockClient.admin.runWorkflows.mockResolvedValueOnce([
			mockRunRef1,
			mockRunRef2,
		]);

		await runFn(taskRef(TestTask), [{ data: "a" }, { data: "b" }]);

		expect(mockRunRef1._standaloneTaskName).toBe("test-task");
		expect(mockRunRef2._standaloneTaskName).toBe("test-task");
	});

	it("rejects when one output rejects", async () => {
		const error = new Error("output failed");
		mockClient.admin.runWorkflows.mockResolvedValueOnce([
			createMockRunRef({ result: "a" }),
			rejectingRunRef(error),
		]);

		await expect(
			runFn(taskRef(TestTask), [{ data: "a" }, { data: "b" }]),
		).rejects.toBe(error);
	});

	it("propagates a runWorkflows rejection", async () => {
		const error = new Error("trigger failed");
		mockClient.admin.runWorkflows.mockRejectedValueOnce(error);

		await expect(
			runFn(taskRef(TestTask), [{ data: "a" }, { data: "b" }]),
		).rejects.toBe(error);
	});

	it("applies interceptor-replaced options to every bulk entry", async () => {
		const replacement = { additionalMetadata: { key: "changed" } };
		const interceptRun = vi.fn(
			(_ctx: unknown, next: (options?: any) => Promise<unknown>) =>
				next(replacement),
		);
		const interceptor = { interceptRun } as unknown as ClientInterceptor;
		const interceptedRunFn = createHostRunForAdmin(mockClient, () => [
			interceptor,
		]);
		mockClient.admin.runWorkflows.mockResolvedValueOnce([
			createMockRunRef({ result: "a" }),
			createMockRunRef({ result: "b" }),
		]);

		await interceptedRunFn(taskRef(TestTask), [{ data: "a" }, { data: "b" }]);

		expect(interceptRun).toHaveBeenCalledTimes(1);
		const entries = mockClient.admin.runWorkflows.mock.calls[0]![0];
		expect(entries).toHaveLength(2);
		for (const entry of entries) {
			expect(entry.options).toBe(replacement);
		}
	});

	it("returns an empty array without calling the SDK for empty input", async () => {
		const result = await runFn(taskRef(TestTask), []);

		expect(result).toEqual([]);
		expect(mockClient.admin.runWorkflows).not.toHaveBeenCalled();
		expect(mockClient.runNoWait).not.toHaveBeenCalled();
	});
});

describe("createHostRunForDurableContext()", () => {
	let durableCtx: ReturnType<typeof createMockDurableContext>;
	let runFn: ReturnType<typeof createHostRunForDurableContext>;

	beforeEach(() => {
		durableCtx = createMockDurableContext();
		runFn = createHostRunForDurableContext(durableCtx);
	});

	it("spawns a child with name, input and key", async () => {
		durableCtx.spawnChild.mockResolvedValueOnce({ result: "test" });

		await runFn(taskRef(TestTask), { data: "test" }, { childKey: "child-1" });

		expect(durableCtx.spawnChild).toHaveBeenCalledWith(
			"test-task",
			{ data: "test" },
			{ childKey: "child-1", key: "child-1" },
		);
	});

	it("returns the child output", async () => {
		durableCtx.spawnChild.mockResolvedValueOnce({ result: "test" });

		const result = await runFn(taskRef(TestTask), { data: "test" });

		expect(result).toEqual({ result: "test" });
	});

	it("spawns children for array inputs", async () => {
		durableCtx.spawnChildren.mockResolvedValueOnce([
			{ result: "a" },
			{ result: "b" },
		]);

		const result = await runFn(
			taskRef(TestTask),
			[{ data: "a" }, { data: "b" }],
			{
				childKey: "child-1",
			},
		);

		expect(durableCtx.spawnChildren).toHaveBeenCalledWith([
			{
				workflow: "test-task",
				input: { data: "a" },
				options: { childKey: "child-1", key: "child-1" },
			},
			{
				workflow: "test-task",
				input: { data: "b" },
				options: { childKey: "child-1", key: "child-1" },
			},
		]);
		expect(durableCtx.spawnChild).not.toHaveBeenCalled();
		expect(result).toEqual([{ result: "a" }, { result: "b" }]);
	});

	it("returns an empty array without calling the SDK for empty input", async () => {
		const result = await runFn(taskRef(TestTask), []);

		expect(result).toEqual([]);
		expect(durableCtx.spawnChildren).not.toHaveBeenCalled();
	});

	it("rejects when wait is false", async () => {
		const result = runFn(taskRef(TestTask), { data: "test" }, { wait: false });

		await expect(result).rejects.toBeInstanceOf(DurableRunNoWaitException);
		expect(durableCtx.spawnChild).not.toHaveBeenCalled();
	});

	it("rejects array input when wait is false", async () => {
		const result = runFn(taskRef(TestTask), [{ data: "a" }], { wait: false });

		await expect(result).rejects.toBeInstanceOf(DurableRunNoWaitException);
		expect(durableCtx.spawnChildren).not.toHaveBeenCalled();
	});

	it("propagates a spawnChild rejection", async () => {
		const error = new Error("child failed");
		durableCtx.spawnChild.mockRejectedValueOnce(error);

		await expect(runFn(taskRef(TestTask), { data: "test" })).rejects.toBe(
			error,
		);
	});

	it("rejects when the engine does not support eviction", async () => {
		const legacyRunFn = createHostRunForDurableContext(
			createMockDurableContext(false),
		);

		await expect(
			legacyRunFn(taskRef(TestTask), { data: "test" }),
		).rejects.toBeInstanceOf(DurableEvictionNotSupportedException);
	});

	it("spawns concurrent children synchronously in call order", async () => {
		durableCtx.spawnChild.mockResolvedValue({ result: "test" });

		const first = runFn(taskRef(TestTask), { data: "a" });
		const second = runFn(taskRef(TestTask), { data: "b" });

		expect(durableCtx.spawnChild.mock.calls.map((call) => call[1])).toEqual([
			{ data: "a" },
			{ data: "b" },
		]);

		await Promise.all([first, second]);
	});
});
