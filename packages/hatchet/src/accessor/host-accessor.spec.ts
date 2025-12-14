import { describe, expect, it } from "vitest";
import { z } from "zod";

import { taskHost, workflowHost } from "../abstracts";
import { Host, Task, WorkflowTask } from "../decorators";
import { fromCtor, fromInstance } from "./host-accessor";

import type { TaskCtx, WorkflowCtx } from "../context";

// TaskHost fixture
@Host({ name: "test-task" })
class TestTask extends taskHost(z.object({ data: z.string() })) {
	@Task({ retries: 3 })
	public execute(_ctx: TaskCtx<typeof this>) {
		return { result: "done" };
	}
}

// TaskHost with no decorated methods
@Host({ name: "no-methods-task" })
class NoMethodsTask extends taskHost() {
	public notDecorated() {
		return {};
	}
}

// WorkflowHost fixture
@Host({ name: "test-workflow", version: "1.0.0" })
class TestWorkflow extends workflowHost(z.object({ id: z.string() })) {
	@WorkflowTask<typeof TestWorkflow>({ parents: [] })
	public step1(_ctx: WorkflowCtx<typeof this>) {
		return { step: 1 };
	}

	@WorkflowTask<typeof TestWorkflow>({ parents: ["step1"] })
	public step2(_ctx: WorkflowCtx<typeof this>) {
		return { step: 2 };
	}
}

// WorkflowHost with no decorated methods
@Host({ name: "no-methods-workflow" })
class NoMethodsWorkflow extends workflowHost() {
	public notDecorated() {
		return {};
	}
}

describe("host-accessor.ts", () => {
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
			const accessor = fromCtor(TestTask);

			expect(accessor.metadata).toEqual({ name: "test-task" });
		});

		it("returns @Host metadata for WorkflowHost", () => {
			const accessor = fromCtor(TestWorkflow);

			expect(accessor.metadata).toEqual({
				name: "test-workflow",
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
			const accessor = fromCtor(TestTask);

			expect(accessor.getTaskMeta("execute")).toEqual({ retries: 3 });
		});
	});
});
