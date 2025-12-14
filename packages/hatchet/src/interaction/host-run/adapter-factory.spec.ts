import { beforeEach, describe, expect, it } from "vitest";

import {
	createHostRunForAdmin,
	createHostRunForContext,
} from "./adapter-factory";
import { TestTask } from "../../__fixtures__/test-hosts";
// eslint-disable-next-line vitest/no-mocks-import -- Factory functions, not module mocks
import { createMockHatchetClient } from "../../__mocks__/hatchet-client.mock";
// eslint-disable-next-line vitest/no-mocks-import -- Factory functions, not module mocks
import { createMockSdkContext } from "../../__mocks__/sdk-context.mock";
import { taskRef } from "../../ref";

import type WorkflowRunRef from "@hatchet-dev/typescript-sdk/util/workflow-run-ref";

/**
 * Creates a minimal mock WorkflowRunRef for testing.
 */
const createMockRunRef = <T>(output: T): WorkflowRunRef<T> =>
	({ output: Promise.resolve(output) }) as unknown as WorkflowRunRef<T>;

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
});
