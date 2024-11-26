import type { ConfigxConfig } from "./configx-config";
import type { z } from "zod";

export type ConfigxZodAllowedTypes = z.ZodString | z.ZodNumber | z.ZodBoolean;

export type ConfigxZodValue =
	| z.ZodOptional<ConfigxZodAllowedTypes>
	| z.ZodNullable<ConfigxZodAllowedTypes>
	| z.ZodOptional<z.ZodNullable<ConfigxZodAllowedTypes>>
	| z.ZodDefault<ConfigxZodAllowedTypes>
	| ConfigxZodAllowedTypes;

export type ConfigxZodObject = z.ZodObject<{
	[k: string]: ConfigxZodValue;
}>;

export type ConfigxType<T extends ConfigxConfig<any>> =
	T extends ConfigxConfig<infer S> ? z.infer<S> : never;

/**
 * Defines the options for the ConfigxModule.
 */
export interface ConfigxSharedOptions {
	prefix?: string;
}
