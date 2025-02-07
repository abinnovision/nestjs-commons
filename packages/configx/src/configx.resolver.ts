import { z } from "zod";

import { ConfigxError } from "./configx.errors";

import type {
	Configx,
	ConfigxZodRawShape,
	ConfigxZodValue,
} from "./configx.types";
import type { ZodObject } from "zod";

interface ResolveConfigArgs<T extends ConfigxZodRawShape> {
	config: Configx<T>;
}

/**
 * Prepares the value for the given Zod schema.
 *
 *
 * @param schemaKey The Zod schema of the value.
 * @param value The value to prepare.
 */
const prepareValue = (schemaKey: ConfigxZodValue, value: any): any => {
	const isFinalType = (it: ConfigxZodValue) =>
		!(it instanceof z.ZodOptional) && !(it instanceof z.ZodNullable);

	const unwrap = (value: any): any => {
		let result = value;

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
export const resolveConfig = <T extends ConfigxZodRawShape>(
	args: ResolveConfigArgs<T>,
): z.infer<ZodObject<T>> => {
	// The object which will later be parsed by the Zod schema.
	const parsableObject: { [key: string]: any } = {};

	for (let [key, schema] of Object.entries(args.config.schema)) {
		let value = process.env[key];

		// Prepare the value because the environment variables are always strings.
		value = prepareValue(schema, value);

		parsableObject[key] = value;
	}

	const result = z.object(args.config.schema).safeParse(parsableObject);

	if (result.success) {
		return result.data;
	} else {
		throw ConfigxError.fromZodError(result.error);
	}
};
