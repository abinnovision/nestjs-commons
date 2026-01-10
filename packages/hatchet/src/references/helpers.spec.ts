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
	});

	describe("#workflowRef()", () => {
		it("creates reference with host property", () => {
			const ref = workflowRef(TestWorkflow);

			expect(ref.host).toBe(TestWorkflow);
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
