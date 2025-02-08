import { ConfigxError } from "./configx.errors";

import type { Configx, ConfigxSchema } from "./configx.types";
import type { StandardSchemaV1 } from "@standard-schema/spec";

interface ResolveConfigArgs<T extends ConfigxSchema> {
	config: Configx<T>;

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
export const resolveConfig = async <T extends ConfigxSchema>(
	args: ResolveConfigArgs<T>,
): Promise<StandardSchemaV1.InferOutput<T>> => {
	// The object which will later be parsed by the Zod schema.
	const parsableObject: { [key: string]: any } = args.resolveEnv();

	const result = await args.config.schema["~standard"].validate(parsableObject);

	if (result.issues === undefined) {
		return result.value;
	} else {
		throw ConfigxError.fromSchemaIssues(result.issues);
	}
};
