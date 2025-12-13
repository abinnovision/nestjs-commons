import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Formats an issue for the ConfigxError.
 *
 * @param issue The issue to format.
 * @returns The formatted issue.
 */
const formatIssue = (issue: StandardSchemaV1.Issue): string => {
	let result = "";

	if ((issue.path?.length ?? 0) > 0) {
		// Format the path segments.
		const path = (issue.path ?? [])
			.map((segment) => {
				// If the segment is an object with a key property, use that.
				if (typeof segment === "object" && "key" in segment) {
					return segment.key.toString();
				}

				return segment.toString();
			})
			.join(".");

		// Add the path to the result.
		result += `'${path}': `;
	} else {
		// If there is no path, the issue is a root issue.
		result += "@: ";
	}

	// Add the message.
	result += issue.message;

	return result;
};

/**
 * Base class for all Configx errors.
 */
export class ConfigxError extends Error {
	public constructor(message: string) {
		super(message);

		this.name = "ConfigxError";
	}
}

/**
 * Error thrown when the configuration is invalid.
 */
export class InvalidConfigError extends ConfigxError {
	public constructor(message: string) {
		super(message);

		this.name = "InvalidConfigError";
	}

	public static fromSchemaIssues(
		issues: readonly StandardSchemaV1.Issue[],
	): InvalidConfigError {
		const messageBody = issues.map(formatIssue).join("; ");

		return new InvalidConfigError(messageBody);
	}
}
