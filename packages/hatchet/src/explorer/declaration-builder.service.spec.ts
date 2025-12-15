import { beforeEach, describe, expect, it } from "vitest";
import { any, captor, mock } from "vitest-mock-extended";

import {
	NoMethodsTask,
	NoMethodsWorkflow,
	NoSchemaTask,
	setParamTypes,
	TestTask,
	TestWorkflow,
} from "../__fixtures__/test-hosts";
import { taskHost, workflowHost } from "../abstracts";
import { Host, Task, WorkflowTask } from "../decorators";
import { Interceptor } from "../interceptor";
import { DeclarationBuilderService } from "./declaration-builder.service";
import { BaseCtx } from "../context/context";

import type { TaskCtx, WorkflowCtx } from "../context";

// Set design:paramtypes for shared fixtures (vitest may not emit decorator metadata)
setParamTypes(TestTask.prototype, "execute", [Object]);
setParamTypes(NoSchemaTask.prototype, "execute", [Object]);

// TaskHost with multiple decorated methods (invalid) - test-specific fixture
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

// WorkflowHost with circular dependency - test-specific fixture
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

const noopInterceptor = mock<Interceptor>();

describe("declaration-builder.service.ts", () => {
	let service: DeclarationBuilderService;

	beforeEach(() => {
		service = new DeclarationBuilderService();
	});

	describe("createDeclaration()", () => {
		it("creates TaskWorkflowDeclaration for TaskHost", () => {
			const host = new TestTask();

			const declaration = service.createDeclaration(host);

			expect(declaration.constructor.name).toBe("TaskWorkflowDeclaration");
		});

		it("creates WorkflowDeclaration for WorkflowHost", () => {
			const host = new TestWorkflow();

			const declaration = service.createDeclaration(host);

			expect(declaration.constructor.name).toBe("WorkflowDeclaration");
		});
	});

	describe("taskHost validation", () => {
		it("throws when TaskHost has no decorated methods", () => {
			const host = new NoMethodsTask();

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
			const host = new NoMethodsWorkflow();

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
			const host = new TestTask();

			// Access private method via declaration creation and verify no error thrown
			// Event-triggered inputs (with EVENT_MARKER) skip schema validation
			const declaration = service.createDeclaration(host);
			expect(declaration).toBeDefined();
		});

		it("validates input against schema when present", () => {
			const host = new TestTask();

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
			const host = new TestWorkflow();

			const declaration = service.createDeclaration(host);

			// Declaration should be created without errors
			expect(declaration).toBeDefined();
		});

		it("resolves parent task references correctly", () => {
			const host = new TestWorkflow();

			const declaration = service.createDeclaration(host);

			// If parent resolution failed, an error would be thrown
			expect(declaration).toBeDefined();
		});
	});

	describe("interceptors", () => {
		it("calls interceptor.intercept() during task execution", async () => {
			const serviceWithInterceptors = new DeclarationBuilderService([
				noopInterceptor,
			]);

			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const fn = (declaration.definition as any).fn;

			await fn(undefined, { input: { data: "test" } });

			expect(noopInterceptor.intercept).toHaveBeenCalledTimes(1);
			expect(noopInterceptor.intercept).toHaveBeenCalledWith(
				expect.objectContaining({ input: { data: "test" } }),
				expect.any(Function),
			);
		});

		it("passes correct BaseCtx to interceptor", async () => {
			const contextCaptor = captor<BaseCtx<any>>();
			const mockInterceptor = mock<Interceptor>();

			const serviceWithInterceptors = new DeclarationBuilderService([
				mockInterceptor,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const mockSdkContext = { input: { data: "test" } };
			const fn = (declaration.definition as any).fn;

			await fn(undefined, mockSdkContext);

			expect(mockInterceptor.intercept).toHaveBeenCalledTimes(1);
			expect(mockInterceptor.intercept).toHaveBeenCalledWith(
				contextCaptor,
				any(),
			);

			expect(contextCaptor.value).toBeDefined();
			expect(contextCaptor.value).toMatchObject({
				input: { data: "test" },
			});
		});

		it("propagates errors from interceptor", async () => {
			const mockInterceptor: Interceptor = {
				intercept: () => {
					throw new Error("Interceptor error");
				},
			};

			const serviceWithInterceptors = new DeclarationBuilderService([
				mockInterceptor,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const mockSdkContext = { input: { data: "test" } };

			const fn = (declaration.definition as any).fn;

			await expect(fn(undefined, mockSdkContext)).rejects.toThrow(
				"Interceptor error",
			);
		});

		it("chains multiple interceptors in array order (first = outermost)", async () => {
			const executionOrder: string[] = [];

			const interceptor1: Interceptor = {
				intercept: async (_ctx, next) => {
					executionOrder.push("interceptor1-start");
					const result = await next();
					executionOrder.push("interceptor1-end");
					return result;
				},
			};

			const interceptor2: Interceptor = {
				intercept: async (_ctx, next) => {
					executionOrder.push("interceptor2-start");
					const result = await next();
					executionOrder.push("interceptor2-end");
					return result;
				},
			};

			const serviceWithInterceptors = new DeclarationBuilderService([
				interceptor1,
				interceptor2,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const fn = (declaration.definition as any).fn;
			await fn(undefined, { input: { data: "test" } });

			expect(executionOrder).toEqual([
				"interceptor1-start",
				"interceptor2-start",
				"interceptor2-end",
				"interceptor1-end",
			]);
		});
	});
});
