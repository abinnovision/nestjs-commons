import type { z } from "zod";

const prettyFormatZodError = (error: z.ZodError): string => {
	let result = "";

	for (const issue of error.issues) {
		result += `${issue.path.join(".")}: ${issue.message}\n`;
	}

	return result;
};

export class ConfigxParseError extends Error {
	public static fromZodError(error: z.ZodError): ConfigxParseError {
		return new ConfigxParseError(prettyFormatZodError(error));
	}

	private constructor(message: string) {
		super(message);
	}
}
