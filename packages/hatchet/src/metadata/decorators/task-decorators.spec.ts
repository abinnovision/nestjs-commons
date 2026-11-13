import { describe, expect, expectTypeOf, it } from "vitest";

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
import type { EvictionPolicy } from "@hatchet-dev/typescript-sdk";

const evictionPolicy: EvictionPolicy = { ttl: "1h" };
const someFlag: boolean = Math.random() > 1;

describe("@Task()", () => {
	it("accepts durable: true with a DurableTaskCtx parameter", () => {
		@Host({ name: "task-durable-positive" })
		class TaskDurablePositive extends taskHost() {
			@Task({ durable: true, retries: 1, evictionPolicy })
			public execute(_ctx: DurableTaskCtx<typeof this>) {
				return {};
			}
		}

		const accessor = fromCtor(TaskDurablePositive);
		expect(accessor.isDurable("execute")).toBe(true);
		expect(accessor.getTaskMeta("execute")).toEqual({
			retries: 1,
			evictionPolicy,
		});
	});

	it("rejects durable: true with a TaskCtx parameter at compile time", () => {
		@Host({ name: "task-durable-ctx-mismatch" })
		class TaskDurableCtxMismatch extends taskHost() {
			// @ts-expect-error durable: true requires a DurableTaskCtx parameter.
			@Task({ durable: true })
			public execute(_ctx: TaskCtx<typeof this>) {
				return {};
			}
		}

		expect(TaskDurableCtxMismatch).toBeDefined();
	});

	it("rejects a DurableTaskCtx parameter without durable: true at compile time", () => {
		@Host({ name: "task-missing-durable-flag" })
		class TaskMissingDurableFlag extends taskHost() {
			// @ts-expect-error A DurableTaskCtx parameter requires durable: true.
			@Task({})
			public execute(_ctx: DurableTaskCtx<typeof this>) {
				return {};
			}
		}

		expect(TaskMissingDurableFlag).toBeDefined();
	});

	it("rejects durable-only options without durable: true at compile time", () => {
		@Host({ name: "task-eviction-non-durable" })
		class TaskEvictionNonDurable extends taskHost() {
			// @ts-expect-error evictionPolicy requires durable: true.
			@Task({ evictionPolicy })
			public execute(_ctx: TaskCtx<typeof this>) {
				return {};
			}
		}

		expect(TaskEvictionNonDurable).toBeDefined();
	});

	it("rejects a non-literal durable flag at compile time", () => {
		@Host({ name: "task-non-literal-flag" })
		class TaskNonLiteralFlag extends taskHost() {
			// @ts-expect-error durable must be a literal.
			@Task({ durable: someFlag })
			public execute(_ctx: TaskCtx<typeof this>) {
				return {};
			}
		}

		expect(TaskNonLiteralFlag).toBeDefined();
	});
});

describe("@WorkflowTask()", () => {
	it("accepts durable methods as parents of non-durable tasks", () => {
		@Host({ name: "workflow-durable-parent" })
		class WorkflowDurableParent extends workflowHost() {
			@WorkflowTask<typeof WorkflowDurableParent>({ durable: true })
			public first(_ctx: DurableWorkflowCtx<typeof this>) {
				return {};
			}

			@WorkflowTask<typeof WorkflowDurableParent>({ parents: ["first"] })
			public second(_ctx: WorkflowCtx<typeof this>) {
				return {};
			}
		}

		const accessor = fromCtor(WorkflowDurableParent);
		expect(accessor.methods).toEqual(["first", "second"]);
		expect(accessor.isDurable("first")).toBe(true);
		expect(accessor.isDurable("second")).toBe(false);
	});

	it("rejects durable: true with a WorkflowCtx parameter at compile time", () => {
		@Host({ name: "workflow-durable-ctx-mismatch" })
		class WorkflowDurableCtxMismatch extends workflowHost() {
			// @ts-expect-error durable: true requires a DurableWorkflowCtx parameter.
			@WorkflowTask<typeof WorkflowDurableCtxMismatch>({ durable: true })
			public step1(_ctx: WorkflowCtx<typeof this>) {
				return {};
			}
		}

		expect(WorkflowDurableCtxMismatch).toBeDefined();
	});

	it("rejects a DurableWorkflowCtx parameter without durable: true at compile time", () => {
		@Host({ name: "workflow-missing-durable-flag" })
		class WorkflowMissingDurableFlag extends workflowHost() {
			// @ts-expect-error A DurableWorkflowCtx parameter requires durable: true.
			@WorkflowTask<typeof WorkflowMissingDurableFlag>({})
			public step1(_ctx: DurableWorkflowCtx<typeof this>) {
				return {};
			}
		}

		expect(WorkflowMissingDurableFlag).toBeDefined();
	});

	it("rejects non-durable-only options with durable: true at compile time", () => {
		@Host({ name: "workflow-slot-cost-durable" })
		class WorkflowSlotCostDurable extends workflowHost() {
			// @ts-expect-error slotCost is not available on durable tasks.
			@WorkflowTask<typeof WorkflowSlotCostDurable>({
				durable: true,
				slotCost: 2,
			})
			public step1(_ctx: DurableWorkflowCtx<typeof this>) {
				return {};
			}
		}

		expect(WorkflowSlotCostDurable).toBeDefined();
	});
});

describe("durable refs", () => {
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
