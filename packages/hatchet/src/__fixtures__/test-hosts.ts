// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from "zod";

import { taskHost, workflowHost } from "../abstracts/index.js";
import {
	DurableTask,
	DurableWorkflowTask,
	Host,
	Task,
	WorkflowTask,
} from "../metadata/index.js";

import type {
	DurableTaskCtx,
	DurableWorkflowCtx,
	TaskCtx,
	WorkflowCtx,
} from "../execution/index.js";

// ============ TaskHost Fixtures ============

/** Standard TaskHost with string data schema */
@Host({ name: "test-task" })
export class TestTask extends taskHost(z.object({ data: z.string() })) {
	@Task({})
	public execute(ctx: TaskCtx<typeof this>) {
		return { result: ctx.input.data };
	}
}

/** TaskHost without any decorated methods (invalid) */
@Host({ name: "no-methods-task" })
export class NoMethodsTask extends taskHost() {
	public notDecorated() {
		return {};
	}
}

/** TaskHost without input schema */
@Host({ name: "no-schema-task" })
export class NoSchemaTask extends taskHost() {
	@Task({})
	public execute(_ctx: TaskCtx<typeof this>) {
		return { result: "no-schema" };
	}
}

// ============ WorkflowHost Fixtures ============

/** Standard WorkflowHost with two-step DAG */
@Host({ name: "test-workflow" })
export class TestWorkflow extends workflowHost(z.object({ id: z.string() })) {
	@WorkflowTask<typeof TestWorkflow>({ parents: [] })
	public step1(_ctx: WorkflowCtx<typeof this>) {
		return { step: 1 };
	}

	@WorkflowTask<typeof TestWorkflow>({ parents: ["step1"] })
	public step2(_ctx: WorkflowCtx<typeof this>) {
		return { step: 2 };
	}
}

/** WorkflowHost without any decorated methods (invalid) */
@Host({ name: "no-methods-workflow" })
export class NoMethodsWorkflow extends workflowHost() {
	public notDecorated() {
		return {};
	}
}

// ============ Durable Fixtures ============

/** Durable TaskHost with string data schema */
@Host({ name: "durable-test-task" })
export class DurableTestTask extends taskHost(z.object({ data: z.string() })) {
	@DurableTask({})
	public execute(ctx: DurableTaskCtx<typeof this>) {
		return { result: ctx.input.data };
	}
}

/** WorkflowHost mixing durable and non-durable tasks in both directions */
@Host({ name: "durable-test-workflow" })
export class DurableTestWorkflow extends workflowHost(
	z.object({ id: z.string() }),
) {
	@WorkflowTask<typeof DurableTestWorkflow>({ parents: [] })
	public step1(_ctx: WorkflowCtx<typeof this>) {
		return { step: 1 };
	}

	@DurableWorkflowTask<typeof DurableTestWorkflow>({ parents: ["step1"] })
	public step2(_ctx: DurableWorkflowCtx<typeof this>) {
		return { step: 2 };
	}

	@WorkflowTask<typeof DurableTestWorkflow>({ parents: ["step2"] })
	public step3(_ctx: WorkflowCtx<typeof this>) {
		return { step: 3 };
	}
}

// ============ Test Utilities ============

/** Sets design:paramtypes metadata for a method (needed in vitest) */
export function setParamTypes(
	target: object,
	method: string,
	types: unknown[],
) {
	Reflect.defineMetadata("design:paramtypes", types, target, method);
}
