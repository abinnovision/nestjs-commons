import { HatchetException } from "./hatchet.exception.js";
import { formatIssueSummary, normalizeIssues } from "./validation-issue.js";

import type { ValidationIssue } from "./validation-issue.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Thrown when a hatchet task or workflow is invoked via the `run`
 * trigger with an input that does not match the host's declared input
 * schema.
 *
 * The {@link InputValidationFailedException.issues} property exposes the
 * structured, per-field validation failures so callers can react
 * programmatically instead of parsing the message string.
 */
export class InputValidationFailedException extends HatchetException {
	public readonly issues: ValidationIssue[];

	public constructor(rawIssues: ReadonlyArray<StandardSchemaV1.Issue>) {
		const issues = normalizeIssues(rawIssues);
		super(formatIssueSummary("Input validation failed", issues));

		this.issues = issues;
	}
}
