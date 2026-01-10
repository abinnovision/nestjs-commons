import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
	NoMethodsTask,
	NoMethodsWorkflow,
	TestTask,
	TestWorkflow,
} from "../__fixtures__/test-hosts";
import { taskHost, workflowHost } from "../abstracts";
import { fromCtor, fromInstance } from "./accessor";
import { Host, Task, WorkflowTask } from "./decorators";

import type { TaskCtx, WorkflowCtx } from "../execution";

// TaskHost with specific retries option for getTaskMeta() test
@Host({ name: "test-task-retries" })
class TestTaskWithRetries extends taskHost(z.object({ data: z.string() })) {
	@Task({ retries: 3 })
	public execute(_ctx: TaskCtx<typeof this>) {
		return { result: "done" };
	}
}

// WorkflowHost with version for metadata test
@Host({ name: "test-workflow-versioned", version: "1.0.0" })
class TestWorkflowVersioned extends workflowHost(z.object({ id: z.string() })) {
	@WorkflowTask<typeof TestWorkflowVersioned>({ parents: [] })
	public step1(_ctx: WorkflowCtx<typeof this>) {
		return { step: 1 };
	}

	@WorkflowTask<typeof TestWorkflowVersioned>({ parents: ["step1"] })
	public step2(_ctx: WorkflowCtx<typeof this>) {
		return { step: 2 };
	}
}

describe("accessor.ts", () => {
	describe("fromCtor()", () => {
		it("creates accessor from TaskHost constructor", () => {
			const accessor = fromCtor(TestTask);

			expect(accessor.ctor).toBe(TestTask);
			expect(accessor.name).toBe("test-task");
			expect(accessor.isTask).toBe(true);
			expect(accessor.isWorkflow).toBe(false);
		});

		it("creates accessor from WorkflowHost constructor", () => {
			const accessor = fromCtor(TestWorkflow);

			expect(accessor.ctor).toBe(TestWorkflow);
			expect(accessor.name).toBe("test-workflow");
			expect(accessor.isTask).toBe(false);
			expect(accessor.isWorkflow).toBe(true);
		});
	});

	describe("fromInstance()", () => {
		it("creates accessor from TaskHost instance", () => {
			const instance = new TestTask();
			const accessor = fromInstance(instance);

			expect(accessor.name).toBe("test-task");
			expect(accessor.isTask).toBe(true);
		});

		it("creates accessor from WorkflowHost instance", () => {
			const instance = new TestWorkflow();
			const accessor = fromInstance(instance);

			expect(accessor.name).toBe("test-workflow");
			expect(accessor.isWorkflow).toBe(true);
		});
	});

	describe("metadata", () => {
		it("returns @Host metadata for TaskHost", () => {
			const accessor = fromCtor(TestTaskWithRetries);

			expect(accessor.metadata).toEqual({ name: "test-task-retries" });
		});

		it("returns @Host metadata for WorkflowHost", () => {
			const accessor = fromCtor(TestWorkflowVersioned);

			expect(accessor.metadata).toEqual({
				name: "test-workflow-versioned",
				version: "1.0.0",
			});
		});
	});

	describe("methods", () => {
		it("returns decorated methods for TaskHost", () => {
			const accessor = fromCtor(TestTask);

			expect(accessor.methods).toEqual(["execute"]);
		});

		it("returns empty array for TaskHost with no decorated methods", () => {
			const accessor = fromCtor(NoMethodsTask);

			expect(accessor.methods).toEqual([]);
		});

		it("returns decorated methods for WorkflowHost", () => {
			const accessor = fromCtor(TestWorkflow);

			expect(accessor.methods).toHaveLength(2);
			expect(accessor.methods).toContain("step1");
			expect(accessor.methods).toContain("step2");
		});

		it("returns empty array for WorkflowHost with no decorated methods", () => {
			const accessor = fromCtor(NoMethodsWorkflow);

			expect(accessor.methods).toEqual([]);
		});
	});

	describe("getWorkflowTaskMeta()", () => {
		it("returns @WorkflowTask metadata", () => {
			const accessor = fromCtor(TestWorkflow);

			expect(accessor.getWorkflowTaskMeta("step1")).toEqual({
				parents: [],
			});
			expect(accessor.getWorkflowTaskMeta("step2")).toEqual({
				parents: ["step1"],
			});
		});
	});

	describe("getTaskMeta()", () => {
		it("returns @Task metadata", () => {
			const accessor = fromCtor(TestTaskWithRetries);

			expect(accessor.getTaskMeta("execute")).toEqual({ retries: 3 });
		});
	});
});
