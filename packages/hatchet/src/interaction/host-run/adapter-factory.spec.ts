import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import {
	createHostRunForAdmin,
	createHostRunForContext,
} from "./adapter-factory";
// eslint-disable-next-line vitest/no-mocks-import -- Factory functions, not module mocks
import { createMockHatchetClient } from "../../__mocks__/hatchet-client.mock";
// eslint-disable-next-line vitest/no-mocks-import -- Factory functions, not module mocks
import { createMockSdkContext } from "../../__mocks__/sdk-context.mock";
import { taskHost } from "../../abstracts";
import { Host, Task } from "../../decorators";
import { taskRef } from "../../ref";

import type { TaskCtx } from "../../context";
import type WorkflowRunRef from "@hatchet-dev/typescript-sdk/util/workflow-run-ref";

/**
 * Creates a minimal mock WorkflowRunRef for testing.
 */
const createMockRunRef = <T>(output: T): WorkflowRunRef<T> =>
	({ output: Promise.resolve(output) }) as unknown as WorkflowRunRef<T>;

// Test fixture
@Host({ name: "test-task" })
class TestTask extends taskHost(z.object({ value: z.number() })) {
	@Task({})
	public execute(ctx: TaskCtx<typeof this>) {
		return { result: ctx.input.value * 2 };
	}
}

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
			createMockRunRef({ result: 20 }),
		);

		await runFn(ref, { value: 10 });

		expect(sdkCtx.runNoWaitChild).toHaveBeenCalledWith(
			"test-task",
			{ value: 10 },
			undefined,
		);
	});

	it("waits for output by default", async () => {
		const ref = taskRef(TestTask);
		const expectedOutput = { result: 20 };
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(
			createMockRunRef(expectedOutput),
		);

		const result = await runFn(ref, { value: 10 });

		expect(result).toEqual(expectedOutput);
	});

	it("returns run ref when wait is false", async () => {
		const ref = taskRef(TestTask);
		const mockRunRef = createMockRunRef({ result: 20 });
		sdkCtx.runNoWaitChild.mockResolvedValueOnce(mockRunRef);

		const result = await runFn(ref, { value: 10 }, { wait: false });

		expect(result).toBe(mockRunRef);
	});

	it("handles array inputs", async () => {
		const ref = taskRef(TestTask);
		sdkCtx.runNoWaitChild
			.mockResolvedValueOnce(createMockRunRef({ result: 20 }))
			.mockResolvedValueOnce(createMockRunRef({ result: 40 }));

		const result = await runFn(ref, [{ value: 10 }, { value: 20 }]);

		expect(sdkCtx.runNoWaitChild).toHaveBeenCalledTimes(2);
		expect(result).toEqual([{ result: 20 }, { result: 40 }]);
	});

	it("returns run refs for array inputs when wait is false", async () => {
		const ref = taskRef(TestTask);
		const mockRunRef1 = createMockRunRef({ result: 20 });
		const mockRunRef2 = createMockRunRef({ result: 40 });
		sdkCtx.runNoWaitChild
			.mockResolvedValueOnce(mockRunRef1)
			.mockResolvedValueOnce(mockRunRef2);

		const result = await runFn(ref, [{ value: 10 }, { value: 20 }], {
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
			createMockRunRef({ result: 20 }),
		);

		await runFn(ref, { value: 10 });

		expect(mockClient.runNoWait).toHaveBeenCalledWith(
			"test-task",
			{ value: 10 },
			{},
		);
	});

	it("waits for output by default", async () => {
		const ref = taskRef(TestTask);
		const expectedOutput = { result: 20 };
		mockClient.runNoWait.mockResolvedValueOnce(
			createMockRunRef(expectedOutput),
		);

		const result = await runFn(ref, { value: 10 });

		expect(result).toEqual(expectedOutput);
	});

	it("returns run ref when wait is false", async () => {
		const ref = taskRef(TestTask);
		const mockRunRef = createMockRunRef({ result: 20 });
		mockClient.runNoWait.mockResolvedValueOnce(mockRunRef);

		const result = await runFn(ref, { value: 10 }, { wait: false });

		expect(result).toBe(mockRunRef);
	});

	it("handles array inputs", async () => {
		const ref = taskRef(TestTask);
		mockClient.runNoWait
			.mockResolvedValueOnce(createMockRunRef({ result: 20 }))
			.mockResolvedValueOnce(createMockRunRef({ result: 40 }));

		const result = await runFn(ref, [{ value: 10 }, { value: 20 }]);

		expect(mockClient.runNoWait).toHaveBeenCalledTimes(2);
		expect(result).toEqual([{ result: 20 }, { result: 40 }]);
	});
});
