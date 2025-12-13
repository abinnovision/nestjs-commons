import { resolveConfig } from "./resolver";

import type { ConfigxSchema, ConfigxType } from "./types";

/**
 * Creates a new Configx class based on the provided schema.
 *
 * @param schema The schema of the Configx class (Zod, ArkType, or any StandardSchema).
 */
export function configx<T extends ConfigxSchema>(schema: T): ConfigxType<T> {
	// eslint-disable-next-line @typescript-eslint/no-extraneous-class
	class ConfigxUsage {
		public static schema = schema;

		public constructor() {
			// Resolve the configuration.
			const config = resolveConfig({
				schema,
				resolveEnv: () => process.env,
			});

			// Assign the resolved configuration to the instance.
			// This is currently the most efficient way to do this without relying on proxies.
			Object.assign(this, config);
		}
	}

	return ConfigxUsage as unknown as ConfigxType<T>;
}
