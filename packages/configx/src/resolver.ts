import { ConfigxError, InvalidConfigError } from "./errors";

import type { ConfigxSchema } from "./types";
import type { StandardSchemaV1 } from "@standard-schema/spec";

interface ResolveConfigArgs<T extends ConfigxSchema> {
	/**
	 * Schema of the Configx class.
	 */
	schema: T;

	/**
	 * Resolves the environment variables object.
	 */
	resolveEnv: () => Record<string, string | undefined>;
}

/**
 * Resolves the configuration with the given ConfigxConfig.
 *
 * @param args The arguments for the function.
 */
export const resolveConfig = <T extends ConfigxSchema>(
	args: ResolveConfigArgs<T>,
): StandardSchemaV1.InferOutput<T> => {
	// The object which will later be parsed by the schema.
	const parsableObject: { [key: string]: any } = args.resolveEnv();

	const result = args.schema["~standard"].validate(parsableObject);
	if (result instanceof Promise) {
		throw new ConfigxError("Asynchronous schemas are not supported");
	}

	if (result.issues === undefined) {
		return result.value;
	} else {
		throw InvalidConfigError.fromSchemaIssues(result.issues);
	}
};
