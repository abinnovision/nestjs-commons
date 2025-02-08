import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Describes the allowed types for a Configx schema.
 */
export type ConfigxSchema = StandardSchemaV1<
	Record<string, string | undefined>,
	Record<string, any>
>;

/**
 * Describes a Configx class.
 * The instance of the class is used to access the configuration.
 */
export interface Configx<T extends ConfigxSchema = any> {
	/**
	 * The Zod schema of the Configx class.
	 */
	schema: T;

	/**
	 * Instantiates a new Configx instance.
	 */
	new (): ConfigxValue<T>;
}

/**
 * Describes the value of the Configx class.
 */
export type ConfigxValue<T extends ConfigxSchema> =
	StandardSchemaV1.InferOutput<T>;
