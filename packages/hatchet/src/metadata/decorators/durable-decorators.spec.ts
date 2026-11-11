import { describe, expect, expectTypeOf, it } from "vitest";

import { DurableTask } from "./durable-task.decorator.js";
import { DurableWorkflowTask } from "./durable-workflow-task.decorator.js";
import { Task } from "./task.decorator.js";
import { WorkflowTask } from "./workflow-task.decorator.js";
import {
	DurableTestTask,
	DurableTestWorkflow,
} from "../../__fixtures__/test-hosts.js";
import { taskHost, workflowHost } from "../../abstracts/index.js";
import { taskRef, workflowRef } from "../../references/index.js";
import { fromCtor } from "../accessor.js";
import { Host } from "./host.decorator.js";

import type {
	DurableTaskCtx,
	DurableWorkflowCtx,
	TaskCtx,
	WorkflowCtx,
} from "../../execution/index.js";
import type { InputOfRef, OutputOfRef } from "../../references/index.js";

describe("durable decorators", () => {
	it("accepts a method with a DurableTaskCtx parameter", () => {
		@Host({ name: "durable-positive" })
		class DurablePositive extends taskHost() {
			@DurableTask({ retries: 1 })
			public execute(_ctx: DurableTaskCtx<typeof this>) {
				return {};
			}
		}

		expect(fromCtor(DurablePositive).isDurable("execute")).toBe(true);
	});

	it("rejects a method with a TaskCtx parameter at compile time", () => {
		@Host({ name: "durable-negative" })
		class DurableNegative extends taskHost() {
			// @ts-expect-error A non-durable ctx is not accepted.
			@DurableTask({})
			public execute(_ctx: TaskCtx<typeof this>) {
				return {};
			}
		}

		expect(DurableNegative).toBeDefined();
	});

	it("rejects a method with a WorkflowCtx parameter at compile time", () => {
		@Host({ name: "durable-workflow-negative" })
		class DurableWorkflowNegative extends workflowHost() {
			// @ts-expect-error A non-durable ctx is not accepted.
			@DurableWorkflowTask<typeof DurableWorkflowNegative>({})
			public step1(_ctx: WorkflowCtx<typeof this>) {
				return {};
			}
		}

		expect(DurableWorkflowNegative).toBeDefined();
	});

	it("accepts durable methods as parents of non-durable tasks", () => {
		@Host({ name: "durable-parent" })
		class DurableParent extends workflowHost() {
			@DurableWorkflowTask<typeof DurableParent>({})
			public first(_ctx: DurableWorkflowCtx<typeof this>) {
				return {};
			}

			@WorkflowTask<typeof DurableParent>({ parents: ["first"] })
			public second(_ctx: WorkflowCtx<typeof this>) {
				return {};
			}
		}

		expect(fromCtor(DurableParent).methods).toEqual(["first", "second"]);
	});

	it("rejects @Task() on a method with a DurableTaskCtx parameter", () => {
		@Host({ name: "task-durable-negative" })
		class TaskDurableNegative extends taskHost() {
			// @ts-expect-error A durable ctx requires @DurableTask().
			@Task({})
			public execute(_ctx: DurableTaskCtx<typeof this>) {
				return {};
			}
		}

		expect(TaskDurableNegative).toBeDefined();
	});

	it("rejects @WorkflowTask() on a method with a DurableWorkflowCtx parameter", () => {
		@Host({ name: "workflow-task-durable-negative" })
		class WorkflowTaskDurableNegative extends workflowHost() {
			// @ts-expect-error A durable ctx requires @DurableWorkflowTask().
			@WorkflowTask<typeof WorkflowTaskDurableNegative>({})
			public step1(_ctx: DurableWorkflowCtx<typeof this>) {
				return {};
			}
		}

		expect(WorkflowTaskDurableNegative).toBeDefined();
	});

	it("infers input and output of durable refs", () => {
		type Ref = ReturnType<typeof taskRef<typeof DurableTestTask>>;

		expectTypeOf<InputOfRef<Ref>>().toEqualTypeOf<{ data: string }>();
		expectTypeOf<OutputOfRef<Ref>>().toEqualTypeOf<{
			result: string;
		}>();
		expectTypeOf<
			OutputOfRef<ReturnType<typeof workflowRef<typeof DurableTestWorkflow>>>
		>().toEqualTypeOf<{
			step1: { step: number };
			step2: { step: number };
			step3: { step: number };
		}>();
	});
});
