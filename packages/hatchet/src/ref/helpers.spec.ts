import { describe, expect, it } from "vitest";

import { getRefAccessor, taskRef, workflowRef } from "./helpers";
import { TestTask, TestWorkflow } from "../__fixtures__/test-hosts";

describe("ref/helpers.ts", () => {
	describe("#taskRef()", () => {
		it("creates reference with host property", () => {
			const ref = taskRef(TestTask);

			expect(ref.host).toBe(TestTask);
		});

		it("creates reference with method property", () => {
			const ref = taskRef(TestTask);

			expect(ref.method).toBe("execute");
		});

		it("freezes the reference object", () => {
			const ref = taskRef(TestTask);

			expect(Object.isFrozen(ref)).toBe(true);
		});

		it("throws when accessing __types property", () => {
			const ref = taskRef(TestTask);

			expect(() => (ref as any).__types).toThrow(
				"Cannot access __types in runtime",
			);
		});
	});

	describe("#workflowRef()", () => {
		it("creates reference with host property", () => {
			const ref = workflowRef(TestWorkflow);

			expect(ref.host).toBe(TestWorkflow);
		});

		it("freezes the reference object", () => {
			const ref = workflowRef(TestWorkflow);

			expect(Object.isFrozen(ref)).toBe(true);
		});

		it("throws when accessing __types property", () => {
			const ref = workflowRef(TestWorkflow);

			expect(() => (ref as any).__types).toThrow(
				"Cannot access __types in runtime",
			);
		});
	});

	describe("#getRefAccessor()", () => {
		it("returns accessor for task ref", () => {
			const ref = taskRef(TestTask);
			const accessor = getRefAccessor(ref);

			expect(accessor.name).toBe("test-task");
			expect(accessor.isTask).toBe(true);
		});

		it("returns accessor for workflow ref", () => {
			const ref = workflowRef(TestWorkflow);
			const accessor = getRefAccessor(ref);

			expect(accessor.name).toBe("test-workflow");
			expect(accessor.isWorkflow).toBe(true);
		});
	});
});
