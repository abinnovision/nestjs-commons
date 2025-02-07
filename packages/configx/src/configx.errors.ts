import { generateErrorMessage } from "zod-error";

import type { z } from "zod";

/**
 * Generic error class for Configx.
 */
export class ConfigxError extends Error {
	public static fromZodError(error: z.ZodError): ConfigxError {
		const message = generateErrorMessage(error.issues, {
			delimiter: { error: "\n - " },
			prefix: " - ",
		});

		return new ConfigxError(`Invalid config:\n${message}`);
	}

	public constructor(message: string) {
		super(message);

		this.name = "ConfigxError";
	}
}
