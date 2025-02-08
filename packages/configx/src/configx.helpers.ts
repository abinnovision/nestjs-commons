import type { Configx, ConfigxSchema } from "./configx.types";

/**
 * Creates a new Configx class.
 *
 * @param schema The Zod schema of the Configx class.
 */
export function configx<T extends ConfigxSchema>(schema: T): Configx<T> {
	class Augmented {
		public static schema = schema;
	}

	return Augmented as unknown as Configx<T>;
}
