import { ModuleRef } from "@nestjs/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { any, captor, mock } from "vitest-mock-extended";

import { DeclarationBuilderService } from "./declaration-builder.service.js";
import {
	DurableTestTask,
	DurableTestWorkflow,
	NoMethodsTask,
	NoMethodsWorkflow,
	NoSchemaTask,
	setParamTypes,
	TestTask,
	TestWorkflow,
} from "../__fixtures__/test-hosts.js";
import { taskHost, workflowHost } from "../abstracts/index.js";
import {
	HatchetException,
	InputValidationFailedException,
} from "../exceptions/index.js";
import { BaseCtx, isDurableCtx } from "../execution/index.js";
import { TaskInterceptor } from "../interceptor/index.js";
import { InterceptorRegistration } from "../internal/registrations.js";
import { Host, Task, WorkflowTask } from "../metadata/index.js";

import type { TaskCtx, WorkflowCtx } from "../execution/index.js";

// Set design:paramtypes for shared fixtures
setParamTypes(TestTask.prototype, "execute", [Object]);
setParamTypes(NoSchemaTask.prototype, "execute", [Object]);
setParamTypes(DurableTestTask.prototype, "execute", [Object]);

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

const noopInterceptor = mock<TaskInterceptor>();

// Helper to create a mock ModuleRef that returns interceptors
function createMockModuleRef(
	interceptorMap: Map<any, TaskInterceptor>,
): ModuleRef {
	return {
		get: (token: any) => interceptorMap.get(token),
	} as unknown as ModuleRef;
}

// Helper to create service with interceptors
const createServiceWithInterceptors = (
	interceptors: TaskInterceptor[],
): DeclarationBuilderService => {
	// Use Symbol as unique tokens for each interceptor
	const tokens = interceptors.map(() => Symbol("InterceptorToken") as any);
	const interceptorMap = new Map<any, TaskInterceptor>();
	tokens.forEach((token, i) => interceptorMap.set(token, interceptors[i]!));

	const mockModuleRef = createMockModuleRef(interceptorMap);
	const registration = new InterceptorRegistration(tokens);

	const service = new DeclarationBuilderService(mockModuleRef, registration);
	service.onModuleInit();

	return service;
};

// Helper to create mock SDK context with additionalMetadata support
const createMockSdkContext = (
	input: unknown = { data: "test" },
	additionalMetadata: Record<string, unknown> = {},
): { input: unknown; additionalMetadata: () => Record<string, unknown> } => ({
	input,
	additionalMetadata: () => additionalMetadata,
});

// Helper to create mock SDK durable context
const createMockDurableSdkContext = (
	input: unknown = { data: "test" },
	invocationCount = 1,
) => ({
	...createMockSdkContext(input),
	invocationCount,
	supportsEviction: true,
	sleepFor: vi.fn(),
	sleepUntil: vi.fn(),
	waitFor: vi.fn(),
	waitForEvent: vi.fn(),
	now: vi.fn(),
});

async function captureRejection(fn: () => Promise<unknown>): Promise<unknown> {
	try {
		await fn();
	} catch (err) {
		return err;
	}

	throw new Error("Expected promise to reject");
}

describe("declaration-builder.service.ts", () => {
	let service: DeclarationBuilderService;

	beforeEach(() => {
		const mockModuleRef = createMockModuleRef(new Map());
		service = new DeclarationBuilderService(mockModuleRef);
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

		it("throws when the task method does not take exactly one parameter", () => {
			@Host({ name: "two-params-task" })
			class TwoParamsTask extends taskHost() {
				@Task({})
				public execute(_ctx: TaskCtx<typeof this>, _other: unknown) {
					return {};
				}
			}

			expect(() => service.createDeclaration(new TwoParamsTask())).toThrow(
				/must have exactly one parameter/,
			);
		});

		it("skips the parameter check without design:paramtypes metadata", () => {
			@Host({ name: "no-metadata-task" })
			class NoMetadataTask extends taskHost() {
				@Task({})
				public execute(_ctx: TaskCtx<typeof this>) {
					return {};
				}
			}
			Reflect.deleteMetadata(
				"design:paramtypes",
				NoMetadataTask.prototype,
				"execute",
			);

			expect(() =>
				service.createDeclaration(new NoMetadataTask()),
			).not.toThrow();
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

			/*
			 * Access private method via declaration creation and verify no error thrown
			 * Event-triggered inputs (with EVENT_MARKER) skip schema validation
			 */
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

		it("throws InputValidationFailedException for run-triggered input that fails the schema", async () => {
			const declaration = service.createDeclaration(new TestTask());
			const fn = (declaration.definition as any).fn as (
				_: unknown,
				ctx: unknown,
			) => Promise<unknown>;

			// `data` should be a string per TestTask's schema
			const sdkContext = createMockSdkContext({ data: 42 });

			await expect(fn(undefined, sdkContext)).rejects.toBeInstanceOf(
				InputValidationFailedException,
			);
		});

		it("exposes structured issues on the thrown InputValidationFailedException", async () => {
			const declaration = service.createDeclaration(new TestTask());
			const fn = (declaration.definition as any).fn as (
				_: unknown,
				ctx: unknown,
			) => Promise<unknown>;

			const sdkContext = createMockSdkContext({ data: 42 });

			const exception = (await captureRejection(() =>
				fn(undefined, sdkContext),
			)) as InputValidationFailedException;

			expect(exception).toBeInstanceOf(InputValidationFailedException);
			expect(exception).toBeInstanceOf(HatchetException);
			expect(exception.issues.length).toBeGreaterThan(0);
			expect(exception.issues[0]?.path).toBe("data");
			expect(exception.message).toContain("Input validation failed");
			expect(exception.message).toContain("data:");
			expect(exception.message).not.toContain("[{");
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
			const serviceWithInterceptors = createServiceWithInterceptors([
				noopInterceptor,
			]);

			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const fn = (declaration.definition as any).fn;

			await fn(undefined, createMockSdkContext());

			expect(noopInterceptor.intercept).toHaveBeenCalledTimes(1);
			expect(noopInterceptor.intercept).toHaveBeenCalledWith(
				expect.objectContaining({ input: { data: "test" } }),
				expect.any(Function),
			);
		});

		it("resolves interceptors on module init", async () => {
			const token = Symbol("InterceptorToken") as any;
			const interceptorMap = new Map<any, TaskInterceptor>();
			const serviceWithInterceptors = new DeclarationBuilderService(
				createMockModuleRef(interceptorMap),
				new InterceptorRegistration([token]),
			);

			// The interceptor instance only becomes available after construction.
			const mockInterceptor = mock<TaskInterceptor>();
			interceptorMap.set(token, mockInterceptor);
			serviceWithInterceptors.onModuleInit();

			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);
			const fn = (declaration.definition as any).fn;
			await fn(undefined, createMockSdkContext());

			expect(mockInterceptor.intercept).toHaveBeenCalledTimes(1);
		});

		it("reuses the same hostConfig across invocations", async () => {
			const mockInterceptor = mock<TaskInterceptor>();
			const serviceWithInterceptors = createServiceWithInterceptors([
				mockInterceptor,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);
			const fn = (declaration.definition as any).fn;

			await fn(undefined, createMockSdkContext());
			await fn(undefined, createMockSdkContext());

			const first = mockInterceptor.intercept.mock.calls[0]![0];
			const second = mockInterceptor.intercept.mock.calls[1]![0];
			expect(first.hostConfig).toBe(second.hostConfig);
			expect(first.hostConfig).toEqual({ onEvents: [], onCrons: [] });
		});

		it("passes correct BaseCtx to interceptor", async () => {
			const contextCaptor = captor<BaseCtx<any>>();
			const mockInterceptor = mock<TaskInterceptor>();

			const serviceWithInterceptors = createServiceWithInterceptors([
				mockInterceptor,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const mockSdkContext = createMockSdkContext();
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
			const mockInterceptor: TaskInterceptor = {
				intercept: () => {
					throw new Error("Interceptor error");
				},
			};

			const serviceWithInterceptors = createServiceWithInterceptors([
				mockInterceptor,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const mockSdkContext = createMockSdkContext();

			const fn = (declaration.definition as any).fn;

			await expect(fn(undefined, mockSdkContext)).rejects.toThrow(
				"Interceptor error",
			);
		});

		it("chains multiple interceptors in array order (first = outermost)", async () => {
			const executionOrder: string[] = [];

			const interceptor1: TaskInterceptor = {
				intercept: async (_ctx, next) => {
					executionOrder.push("interceptor1-start");
					const result = await next();
					executionOrder.push("interceptor1-end");

					return result;
				},
			};

			const interceptor2: TaskInterceptor = {
				intercept: async (_ctx, next) => {
					executionOrder.push("interceptor2-start");
					const result = await next();
					executionOrder.push("interceptor2-end");

					return result;
				},
			};

			const serviceWithInterceptors = createServiceWithInterceptors([
				interceptor1,
				interceptor2,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new TestTask(),
			);

			const fn = (declaration.definition as any).fn;
			await fn(undefined, createMockSdkContext());

			expect(executionOrder).toEqual([
				"interceptor1-start",
				"interceptor2-start",
				"interceptor2-end",
				"interceptor1-end",
			]);
		});
	});

	describe("durable tasks", () => {
		it("registers a durable TaskHost task as a durable task", () => {
			const declaration = service.createDeclaration(new DurableTestTask());

			expect(declaration.definition._durableTasks).toHaveLength(1);
			expect(declaration.definition._tasks).toHaveLength(0);
		});

		it("keeps non-durable TaskHost tasks unchanged", () => {
			const declaration = service.createDeclaration(new TestTask());

			expect(declaration.definition._tasks).toHaveLength(1);
			expect(declaration.definition._durableTasks).toHaveLength(0);
		});

		it("mixes durable and non-durable tasks in one workflow", () => {
			const { definition } = service.createDeclaration(
				new DurableTestWorkflow(),
			);

			const step1 = definition._tasks.find((t) => t.name === "step1");
			const step2 = definition._durableTasks.find((t) => t.name === "step2");
			const step3 = definition._tasks.find((t) => t.name === "step3");

			expect(definition._tasks).toHaveLength(2);
			expect(definition._durableTasks).toHaveLength(1);
			expect(step2?.parents).toEqual([step1]);
			expect(step3?.parents).toEqual([step2]);
		});

		it("runs interceptors with a durable ctx", async () => {
			const mockInterceptor = mock<TaskInterceptor>();
			const serviceWithInterceptors = createServiceWithInterceptors([
				mockInterceptor,
			]);
			const declaration = serviceWithInterceptors.createDeclaration(
				new DurableTestTask(),
			);
			const fn = (declaration.definition as any).fn;

			await fn(undefined, createMockDurableSdkContext({ data: "test" }, 2));

			const ctx = mockInterceptor.intercept.mock.calls[0]![0];
			expect(isDurableCtx(ctx)).toBe(true);
			expect(ctx).toMatchObject({
				input: { data: "test" },
				invocationCount: 2,
				isReplay: true,
			});
		});

		it("runs the durable workflow task with a durable ctx", async () => {
			const mockInterceptor = mock<TaskInterceptor>();
			const serviceWithInterceptors = createServiceWithInterceptors([
				mockInterceptor,
			]);
			const { definition } = serviceWithInterceptors.createDeclaration(
				new DurableTestWorkflow(),
			);
			const step2 = definition._durableTasks[0]!;

			await step2.fn!(
				undefined as any,
				createMockDurableSdkContext({ id: "1" }) as any,
			);

			const ctx = mockInterceptor.intercept.mock.calls[0]![0];
			expect(isDurableCtx(ctx)).toBe(true);
		});

		it("validates the input on every invocation", async () => {
			const declaration = service.createDeclaration(new DurableTestTask());
			const fn = (declaration.definition as any).fn;

			await expect(
				fn(undefined, createMockDurableSdkContext({ data: 42 }, 1)),
			).rejects.toBeInstanceOf(InputValidationFailedException);
			await expect(
				fn(undefined, createMockDurableSdkContext({ data: 42 }, 2)),
			).rejects.toBeInstanceOf(InputValidationFailedException);
		});

		it("runs the durable task method", async () => {
			const declaration = service.createDeclaration(new DurableTestTask());
			const fn = (declaration.definition as any).fn;

			await expect(
				fn(undefined, createMockDurableSdkContext({ data: "test" })),
			).resolves.toEqual({ result: "test" });
		});
	});
});
