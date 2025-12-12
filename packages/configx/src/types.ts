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
 */
export interface ConfigxType<T extends ConfigxSchema = any> {
	/**
	 * Standard Schema V1 schema of the Configx class.
	 */
	schema: T;

	/**
	 * Instantiates a new Configx instance.
	 */
	new (): StandardSchemaV1.InferOutput<T>;
}
