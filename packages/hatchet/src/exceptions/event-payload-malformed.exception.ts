import { HatchetException } from "./hatchet.exception.js";
import { formatIssueSummary, normalizeIssues } from "./validation-issue.js";

import type { ValidationIssue } from "./validation-issue.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Thrown when an event payload received by
 * {@link EventDefinition.cast} or {@link EventDefinition.isCtx} does not
 * match the event's declared schema.
 */
export class EventPayloadMalformedException extends HatchetException {
	public readonly eventName: string;
	public readonly issues: ValidationIssue[];

	public constructor(
		eventName: string,
		rawIssues: ReadonlyArray<StandardSchemaV1.Issue>,
	) {
		const issues = normalizeIssues(rawIssues);
		super(
			formatIssueSummary(`Event '${eventName}' payload is malformed`, issues),
		);

		this.eventName = eventName;
		this.issues = issues;
	}
}
