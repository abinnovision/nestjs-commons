import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { z as z3 } from "zod/v3";
import { z as z4 } from "zod/v4";

import { formatIssueSummary, normalizeIssues } from "./validation-issue.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Runs the given StandardSchema-compatible schema synchronously and
 * returns the issues it produced. Fails the test if the schema validated
 * successfully or returned a Promise.
 */
function runFailing(
	schema: StandardSchemaV1,
	input: unknown,
): ReadonlyArray<StandardSchemaV1.Issue> {
	const result = schema["~standard"].validate(input);

	if (result instanceof Promise) {
		throw new Error("Schema unexpectedly returned a Promise");
	}

	if (!("issues" in result) || result.issues === undefined) {
		throw new Error("Schema unexpectedly validated successfully");
	}

	return result.issues;
}

describe("normalizeIssues()", () => {
	describe.each([
		{
			name: "zod/v3",
			schema: z3.object({
				user: z3.object({ email: z3.string().email() }),
				items: z3.array(z3.object({ id: z3.string() })),
			}),
		},
		{
			name: "zod/v4",
			schema: z4.object({
				user: z4.object({ email: z4.email() }),
				items: z4.array(z4.object({ id: z4.string() })),
			}),
		},
		{
			name: "arktype",
			schema: type({
				user: { email: "string.email" },
				items: type({ id: "string" }).array(),
			}),
		},
	])("with $name", ({ schema }) => {
		const input = {
			user: { email: "not-an-email" },
			items: [{ id: 1 }],
		};

		it("formats nested object paths with dot notation", () => {
			const issues = normalizeIssues(runFailing(schema, input));
			const paths = issues.map((i) => i.path);

			expect(paths).toContain("user.email");
		});

		it("formats array index paths with bracket notation", () => {
			const issues = normalizeIssues(runFailing(schema, input));
			const paths = issues.map((i) => i.path);

			expect(paths).toContain("items[0].id");
		});

		it("preserves the original human-readable message verbatim", () => {
			const raw = runFailing(schema, input);
			const issues = normalizeIssues(raw);

			expect(issues.map((i) => i.message)).toEqual(raw.map((i) => i.message));
		});

		it("returns one normalized issue per raw issue", () => {
			const raw = runFailing(schema, input);
			const issues = normalizeIssues(raw);

			expect(issues).toHaveLength(raw.length);
		});
	});

	it("omits path when the failure is at the root", () => {
		const issues = normalizeIssues(runFailing(z4.string(), 42));

		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toBeUndefined();
	});

	it("handles arktype's deeply nested array paths", () => {
		const schema = type({
			matrix: type("number").array().array(),
		});
		const issues = normalizeIssues(
			runFailing(schema, {
				matrix: [
					[1, 2],
					[3, "oops"],
				],
			}),
		);

		expect(issues[0]?.path).toBe("matrix[1][1]");
	});

	it("handles zod v4's deeply nested array paths", () => {
		const schema = z4.object({
			matrix: z4.array(z4.array(z4.number())),
		});
		const issues = normalizeIssues(
			runFailing(schema, {
				matrix: [
					[1, 2],
					[3, "oops"],
				],
			}),
		);

		expect(issues[0]?.path).toBe("matrix[1][1]");
	});
});

describe("formatIssueSummary()", () => {
	it("joins multiple issues with '; ' and prefixes with '<prefix>: '", () => {
		const summary = formatIssueSummary("Input validation failed", [
			{ message: "Invalid email", path: "user.email" },
			{ message: "Required", path: "items[0].id" },
		]);

		expect(summary).toBe(
			"Input validation failed: user.email: Invalid email; items[0].id: Required",
		);
	});

	it("omits the path segment for root-level issues", () => {
		const summary = formatIssueSummary("Input validation failed", [
			{ message: "Expected string" },
		]);

		expect(summary).toBe("Input validation failed: Expected string");
	});

	it("returns just the prefix when there are no issues", () => {
		expect(formatIssueSummary("Input validation failed", [])).toBe(
			"Input validation failed",
		);
	});

	it("never produces a JSON-stringified payload", () => {
		const summary = formatIssueSummary("Input validation failed", [
			{ message: "Invalid email", path: "user.email" },
		]);

		expect(summary).not.toContain("[{");
		expect(summary).not.toContain('"code"');
	});

	it("produces a JSON-free human-readable summary for zod/v3", () => {
		const schema = z3.object({ email: z3.string() });
		const summary = formatIssueSummary(
			"Input validation failed",
			normalizeIssues(runFailing(schema, { email: 42 })),
		);

		expect(summary).toMatch(/^Input validation failed: email: /);
		expect(summary).not.toContain("[{");
	});

	it("produces a JSON-free human-readable summary for zod/v4", () => {
		const schema = z4.object({ email: z4.string() });
		const summary = formatIssueSummary(
			"Input validation failed",
			normalizeIssues(runFailing(schema, { email: 42 })),
		);

		expect(summary).toMatch(/^Input validation failed: email: /);
		expect(summary).not.toContain("[{");
	});

	it("produces a JSON-free human-readable summary for arktype", () => {
		const schema = type({ email: "string" });
		const summary = formatIssueSummary(
			"Input validation failed",
			normalizeIssues(runFailing(schema, { email: 42 })),
		);

		expect(summary).toMatch(/^Input validation failed: email: /);
		expect(summary).not.toContain("[{");
	});
});
