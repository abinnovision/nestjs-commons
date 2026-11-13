import { describe, expect, it } from "vitest";

import { taskRef, toHostCtor, workflowRef } from "./helpers.js";
import { TestTask, TestWorkflow } from "../__fixtures__/test-hosts.js";

describe("ref/helpers.ts", () => {
	describe("#taskRef()", () => {
		it("creates reference with host property", () => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- covers the deprecated helper
			const ref = taskRef(TestTask);

			expect(ref.host).toBe(TestTask);
		});

		it("creates reference with method property", () => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- covers the deprecated helper
			const ref = taskRef(TestTask);

			expect(ref.method).toBe("execute");
		});
	});

	describe("#workflowRef()", () => {
		it("creates reference with host property", () => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- covers the deprecated helper
			const ref = workflowRef(TestWorkflow);

			expect(ref.host).toBe(TestWorkflow);
		});
	});

	describe("#toHostCtor()", () => {
		it("returns a host class as is", () => {
			expect(toHostCtor(TestTask)).toBe(TestTask);
		});

		it("returns the host of a task ref", () => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- covers the deprecated helper
			expect(toHostCtor(taskRef(TestTask))).toBe(TestTask);
		});

		it("returns the host of a workflow ref", () => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- covers the deprecated helper
			expect(toHostCtor(workflowRef(TestWorkflow))).toBe(TestWorkflow);
		});
	});
});
