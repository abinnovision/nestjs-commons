import {
	DynamicModule,
	FactoryProvider,
	Module,
	OnModuleInit,
} from "@nestjs/common";

import { resolveConfig } from "./configx.resolver";
import { Configx } from "./configx.types";

@Module({})
export class ConfigxModule implements OnModuleInit {
	/**
	 * Registers the ConfigxModule in the root module.
	 *
	 * @param configs
	 */
	public static register(...configs: Configx[]): DynamicModule {
		const configProviders = this.resolveConfigProviders(configs);

		return {
			module: ConfigxModule,
			providers: configProviders,
			exports: configProviders,
		};
	}

	/**
	 * Resolves the config providers for the given options.
	 *
	 * @private
	 * @param configs
	 */
	private static resolveConfigProviders(configs: Configx[]): FactoryProvider[] {
		// If there are no configs, return an empty array.
		if (configs.length === 0) {
			return [];
		}

		return configs.map((config) => {
			return {
				provide: config,
				useFactory: async () => {
					// Resolve the environment variables.
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const configValues = await resolveConfig({
						config,
						resolveEnv: () => process.env,
					});

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument
					return Object.assign(Object.create(config.prototype), configValues);
				},
			};
		});
	}

	public onModuleInit() {}
}
