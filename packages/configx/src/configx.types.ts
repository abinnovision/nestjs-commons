import type { z } from "zod";

export type ConfigxZodAllowedTypes = z.ZodString | z.ZodNumber | z.ZodBoolean;

export type ConfigxZodValue =
	| z.ZodOptional<ConfigxZodAllowedTypes>
	| z.ZodNullable<ConfigxZodAllowedTypes>
	| z.ZodOptional<z.ZodNullable<ConfigxZodAllowedTypes>>
	| z.ZodDefault<ConfigxZodAllowedTypes>
	| ConfigxZodAllowedTypes;

export interface ConfigxZodRawShape {
	[k: string]: ConfigxZodValue;
}

/**
 * Describes a Configx class.
 * The instance of the class is used to access the configuration.
 */
export interface Configx<T extends ConfigxZodRawShape = any> {
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
 * Describes the value of a Configx class.
 */
export type ConfigxValue<T extends ConfigxZodRawShape> = {
	[K in keyof T]: z.infer<T[K]>;
};
