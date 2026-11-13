import { describe, expectTypeOf, it } from "vitest";

import {
	NoMethodsTask,
	TestTask,
	TestWorkflow,
} from "../../__fixtures__/test-hosts.js";
import { taskRef } from "../../references/index.js";

import type { HostRunFn } from "./function-type.js";
import type { TaskRef } from "../../references/refs.js";
import type { TaskHostCtor, TaskInput } from "../../references/shared.js";
import type { WorkflowRunRef } from "../../sdk/types.js";

declare const run: HostRunFn;

const _wrapCtor = <C extends TaskHostCtor<any>>(host: C, input: TaskInput<C>) =>
	run(host, input);

const _wrapRef = <C extends TaskHostCtor<any>>(
	ref: TaskRef<C>,
	input: TaskInput<C>,
	// eslint-disable-next-line @typescript-eslint/no-deprecated -- covers the deprecated ref overload
) => run(ref, input);

// Type-level only; never called.
const _calls = () => {
	// @ts-expect-error wrong task input
	void run(TestTask, { id: "1" });
	// @ts-expect-error wrong workflow input
	void run(TestWorkflow, { data: "a" });

	return {
		taskSingle: run(TestTask, { data: "a" }),
		taskArray: run(TestTask, [{ data: "a" }]),
		taskNoWait: run(TestTask, { data: "a" }, { wait: false }),
		workflow: run(TestWorkflow, { id: "1" }),
		// eslint-disable-next-line @typescript-eslint/no-deprecated -- covers the deprecated ref overload
		ref: run(taskRef(TestTask), { data: "a" }),
		noMethods: run(NoMethodsTask, {}),
	};
};

type Results = {
	[K in keyof ReturnType<typeof _calls>]: Awaited<ReturnType<typeof _calls>[K]>;
};

describe("hostRunFn", () => {
	it("infers a single task output", () => {
		expectTypeOf<Results["taskSingle"]>().toEqualTypeOf<{ result: string }>();
	});

	it("infers an array of task outputs for array input", () => {
		expectTypeOf<Results["taskArray"]>().toEqualTypeOf<{ result: string }[]>();
	});

	it("returns a run ref when wait is false", () => {
		expectTypeOf<Results["taskNoWait"]>().toEqualTypeOf<
			WorkflowRunRef<{ result: string }>
		>();
	});

	it("infers the workflow output map", () => {
		expectTypeOf<Results["workflow"]>().toEqualTypeOf<{
			step1: { step: number };
			step2: { step: number };
		}>();
	});

	it("infers the same output for a deprecated ref", () => {
		expectTypeOf<Results["ref"]>().toEqualTypeOf<Results["taskSingle"]>();
	});

	it("resolves to never for a host without a task method", () => {
		expectTypeOf<Results["noMethods"]>().toEqualTypeOf<never>();
	});

	it("infers exact outputs through generic wrappers", () => {
		expectTypeOf<
			Awaited<ReturnType<typeof _wrapCtor<typeof TestTask>>>
		>().toEqualTypeOf<{ result: string }>();
		expectTypeOf<
			Awaited<ReturnType<typeof _wrapRef<typeof TestTask>>>
		>().toEqualTypeOf<{ result: string }>();
	});
});
