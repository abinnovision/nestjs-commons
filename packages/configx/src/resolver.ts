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
 * Resolves and validates configuration from environment variables using the provided schema.
 *
 * @param args The resolution arguments.
 * @param args.schema A Standard Schema V1 compatible schema (Zod, ArkType, etc.).
 * @param args.resolveEnv Function that returns the environment variables object.
 * @returns The validated and transformed configuration object.
 * @throws {ConfigxError} If the schema uses asynchronous validation.
 * @throws {InvalidConfigError} If the environment variables fail schema validation.
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
