import { z } from "zod";

import { taskHost, workflowHost } from "../abstracts";
import { Host, Task, WorkflowTask } from "../decorators";

import type { TaskCtx, WorkflowCtx } from "../context";

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

// ============ Test Utilities ============

/** Sets design:paramtypes metadata for a method (needed in vitest) */
export function setParamTypes(
	target: object,
	method: string,
	types: unknown[],
) {
	Reflect.defineMetadata("design:paramtypes", types, target, method);
}
