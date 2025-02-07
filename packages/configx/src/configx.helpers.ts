import type { Configx, ConfigxZodRawShape } from "./configx.types";

/**
 * Creates a new Configx class.
 *
 * @param schema The Zod schema of the Configx class.
 */
export function configx<T extends ConfigxZodRawShape>(schema: T): Configx<T> {
	class Augmented {
		public static schema = schema;
	}

	return Augmented as unknown as Configx<T>;
}
