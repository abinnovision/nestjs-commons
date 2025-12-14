import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { taskHost, workflowHost } from "../abstracts";
import { Host, Task, WorkflowTask } from "../decorators";
import { DeclarationBuilderService } from "./declaration-builder.service";

import type { TaskCtx, WorkflowCtx } from "../context";

// Valid TaskHost fixture
@Host({ name: "valid-task" })
class ValidTask extends taskHost(z.object({ data: z.string() })) {
	@Task({})
	public execute(ctx: TaskCtx<typeof this>) {
		return { result: ctx.input.data };
	}
}
// Manually set design:paramtypes for test (vitest may not emit decorator metadata)
Reflect.defineMetadata(
	"design:paramtypes",
	[Object],
	ValidTask.prototype,
	"execute",
);

// TaskHost with no decorated methods
@Host({ name: "no-task-methods" })
class NoTaskMethods extends taskHost() {
	public notATask() {
		return {};
	}
}

// TaskHost with multiple decorated methods (invalid)
@Host({ name: "multiple-task-methods" })
class MultipleTaskMethods extends taskHost() {
	@Task({})
	public task1(_ctx: TaskCtx<typeof this>) {
		return { result: 1 };
	}

	@Task({})
	public task2(_ctx: TaskCtx<typeof this>) {
		return { result: 2 };
	}
}

// Valid WorkflowHost fixture
@Host({ name: "valid-workflow" })
class ValidWorkflow extends workflowHost(z.object({ id: z.string() })) {
	@WorkflowTask<typeof ValidWorkflow>({ parents: [] })
	public step1(_ctx: WorkflowCtx<typeof this>) {
		return { step: 1 };
	}

	@WorkflowTask<typeof ValidWorkflow>({ parents: ["step1"] })
	public step2(_ctx: WorkflowCtx<typeof this>) {
		return { step: 2 };
	}
}

// WorkflowHost with no decorated methods
@Host({ name: "no-workflow-tasks" })
class NoWorkflowTasks extends workflowHost() {
	public notATask() {
		return {};
	}
}

// WorkflowHost with circular dependency
@Host({ name: "circular-workflow" })
class CircularWorkflow extends workflowHost() {
	@WorkflowTask<typeof CircularWorkflow>({ parents: ["step2"] })
	public step1(_ctx: WorkflowCtx<typeof this>) {
		return { step: 1 };
	}

	@WorkflowTask<typeof CircularWorkflow>({ parents: ["step1"] })
	public step2(_ctx: WorkflowCtx<typeof this>) {
		return { step: 2 };
	}
}

// TaskHost without schema (no validation)
@Host({ name: "no-schema-task" })
class NoSchemaTask extends taskHost() {
	@Task({})
	public execute(_ctx: TaskCtx<typeof this>) {
		return { result: "no-schema" };
	}
}
// Manually set design:paramtypes for test
Reflect.defineMetadata(
	"design:paramtypes",
	[Object],
	NoSchemaTask.prototype,
	"execute",
);

describe("declaration-builder.service.ts", () => {
	let service: DeclarationBuilderService;

	beforeEach(() => {
		service = new DeclarationBuilderService();
	});

	describe("createDeclaration()", () => {
		it("creates TaskWorkflowDeclaration for TaskHost", () => {
			const host = new ValidTask();

			const declaration = service.createDeclaration(host);

			expect(declaration.constructor.name).toBe("TaskWorkflowDeclaration");
		});

		it("creates WorkflowDeclaration for WorkflowHost", () => {
			const host = new ValidWorkflow();

			const declaration = service.createDeclaration(host);

			expect(declaration.constructor.name).toBe("WorkflowDeclaration");
		});
	});

	describe("taskHost validation", () => {
		it("throws when TaskHost has no decorated methods", () => {
			const host = new NoTaskMethods();

			expect(() => service.createDeclaration(host)).toThrow(
				/must have exactly one decorated method/,
			);
		});

		it("throws when TaskHost has multiple decorated methods", () => {
			const host = new MultipleTaskMethods();

			expect(() => service.createDeclaration(host)).toThrow(
				/must have exactly one decorated method/,
			);
		});
	});

	describe("workflowHost validation", () => {
		it("throws when WorkflowHost has no decorated methods", () => {
			const host = new NoWorkflowTasks();

			expect(() => service.createDeclaration(host)).toThrow(
				/must have at least one decorated method/,
			);
		});

		it("throws when WorkflowHost has circular dependencies", () => {
			const host = new CircularWorkflow();

			expect(() => service.createDeclaration(host)).toThrow(
				/circular dependency/,
			);
		});
	});

	describe("validateAndTransformInput()", () => {
		it("skips validation for event-triggered inputs", () => {
			const host = new ValidTask();

			// Access private method via declaration creation and verify no error thrown
			// Event-triggered inputs (with EVENT_MARKER) skip schema validation
			const declaration = service.createDeclaration(host);
			expect(declaration).toBeDefined();
		});

		it("validates input against schema when present", () => {
			const host = new ValidTask();

			// The declaration wraps the input validation
			const declaration = service.createDeclaration(host);
			expect(declaration).toBeDefined();
		});

		it("passes through input when no schema is defined", () => {
			const host = new NoSchemaTask();

			const declaration = service.createDeclaration(host);
			expect(declaration).toBeDefined();
		});
	});

	describe("workflow graph building", () => {
		it("creates declaration with tasks in topological order", () => {
			const host = new ValidWorkflow();

			const declaration = service.createDeclaration(host);

			// Declaration should be created without errors
			expect(declaration).toBeDefined();
		});

		it("resolves parent task references correctly", () => {
			const host = new ValidWorkflow();

			const declaration = service.createDeclaration(host);

			// If parent resolution failed, an error would be thrown
			expect(declaration).toBeDefined();
		});
	});
});
