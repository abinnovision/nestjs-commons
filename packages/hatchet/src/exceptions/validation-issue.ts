import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Extracts the raw key from a StandardSchema path entry, which can be
 * either a {@link PropertyKey} or a {@link StandardSchemaV1.PathSegment}.
 */
function toSegmentKey(
	entry: PropertyKey | StandardSchemaV1.PathSegment,
): PropertyKey {
	if (typeof entry === "object") {
		return entry.key;
	}

	return entry;
}

/**
 * Formats a sequence of path keys into dot/bracket notation.
 * Numeric keys become `[n]` segments; string keys become dot-joined
 * segments. Symbol keys fall back to their `.toString()` form.
 */
function formatPath(segments: ReadonlyArray<PropertyKey>): string {
	let result = "";

	for (const segment of segments) {
		if (typeof segment === "number") {
			result += `[${String(segment)}]`;
			continue;
		}

		const asString = typeof segment === "symbol" ? segment.toString() : segment;

		if (result.length === 0) {
			result = asString;
		} else {
			result += `.${asString}`;
		}
	}

	return result;
}

/**
 * Structured representation of a single schema validation issue.
 */
export interface ValidationIssue {
	/**
	 * Human-readable description of why this field failed validation.
	 */
	message: string;

	/**
	 * Dot/bracket notation path to the offending field
	 * (e.g. `user.email`, `items[0].id`).
	 * Omitted when the failure is at the root.
	 */
	path?: string;
}

/**
 * Converts the raw issues produced by a StandardSchema-compatible schema
 * into the structured {@link ValidationIssue} shape exposed on hatchet
 * exceptions.
 */
export function normalizeIssues(
	raw: ReadonlyArray<StandardSchemaV1.Issue>,
): ValidationIssue[] {
	return raw.map((issue) => {
		const segments = (issue.path ?? []).map(toSegmentKey);

		if (segments.length === 0) {
			return { message: issue.message };
		}

		return {
			message: issue.message,
			path: formatPath(segments),
		};
	});
}

/**
 * Builds a human-readable summary by joining each issue as
 * `<path>: <message>` (or just `<message>` when no path is present),
 * prefixed with the given prefix.
 *
 * Falls back to just the prefix when no issues are provided.
 */
export function formatIssueSummary(
	prefix: string,
	issues: ValidationIssue[],
): string {
	if (issues.length === 0) {
		return prefix;
	}

	const summary = issues
		.map((issue) =>
			issue.path !== undefined
				? `${issue.path}: ${issue.message}`
				: issue.message,
		)
		.join("; ");

	return `${prefix}: ${summary}`;
}
