import { z } from "zod";

import { ConfigxParseError } from "./configx-parse.error";

import type { ConfigxConfig } from "./configx-config";
import type {
	ConfigxSharedOptions,
	ConfigxZodObject,
	ConfigxZodValue,
} from "./types";

interface ResolveConfigArgs<T extends ConfigxZodObject> {
	config: ConfigxConfig<T>;
	sharedOptions: ConfigxSharedOptions;
}

/**
 * Builds an environment variable name from a given string.
 *
 * For example, the input "fooBar" will be transformed to "FOO_BAR".
 *
 * @param input The input string.
 * @returns The transformed string.
 */
const buildTargetEnvVar = (input: string): string => {
	let result = "";

	const chars = input.split("");
	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];
		if (char.toUpperCase() === char && i > 0) {
			// If the character is uppercase, we prefix it with an underscore.
			result += `_${char}`;
		} else {
			// Otherwise, we just add the character to the result.
			result += char.toUpperCase();
		}
	}

	return result;
};

const prepareValue = (schemaKey: ConfigxZodValue, value: any): any => {
	const isFinalType = (it: ConfigxZodValue) =>
		!(it instanceof z.ZodOptional) && !(it instanceof z.ZodNullable);

	const unwrap = (value: any): any => {
		let result;

		if (value instanceof z.ZodOptional) {
			result = value.unwrap();
		}

		if (value instanceof z.ZodNullable) {
			result = value.unwrap();
		}

		// If the value is not the final type, unwrap it.
		if (!isFinalType(result)) {
			result = unwrap(result);
		}

		return result;
	};

	const unwrappedSchemaKey = unwrap(schemaKey);

	if (unwrappedSchemaKey instanceof z.ZodNumber) {
		try {
			return parseInt(value, 10);
		} catch (_) {
			return value;
		}
	} else if (unwrappedSchemaKey instanceof z.ZodBoolean) {
		if (value === "true") {
			return true;
		} else if (value === "false") {
			return false;
		} else {
			return value;
		}
	} else {
		return value;
	}
};

/**
 * Resolves the configuration with the given ConfigxConfig.
 *
 * @param args The arguments for the function.
 */
export const resolveConfig = <T extends ConfigxZodObject>(
	args: ResolveConfigArgs<T>,
): z.infer<T> => {
	// The object which will later be parsed by the Zod schema.
	const parsableObject: { [key: string]: any } = {};

	for (let [key, schema] of Object.entries(args.config.schema.shape)) {
		// Resolve the environment variable name.
		const envVar = buildTargetEnvVar(key);

		let value = process.env[envVar];

		// Prepare the value because the environment variables are always strings.
		value = prepareValue(schema, value);

		parsableObject[key] = value;
	}

	const result = args.config.schema.safeParse(parsableObject);

	if (result.success) {
		return result.data;
	} else {
		throw ConfigxParseError.fromZodError(result.error);
	}
};
