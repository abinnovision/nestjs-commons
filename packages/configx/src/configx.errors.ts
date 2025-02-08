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
		// If there is a path, the issue is a nested issue.
		result += issue.path?.join(".") + ": ";
	} else {
		// If there is no path, the issue is a root issue.
		result += "@: ";
	}

	// Add the message.
	result += issue.message;

	return result;
};

/**
 * Generic error class for Configx.
 */
export class ConfigxError extends Error {
	public static fromSchemaIssues(
		issues: readonly StandardSchemaV1.Issue[],
	): ConfigxError {
		const messageHeader = "Invalid config:\n";

		const messageBody = issues.map((it) => `- ${formatIssue(it)}`).join("\n");

		return new ConfigxError(`${messageHeader}${messageBody}`);
	}

	public constructor(message: string) {
		super(message);

		this.name = "ConfigxError";
	}
}
