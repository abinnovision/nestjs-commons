import {
	DynamicModule,
	FactoryProvider,
	Module,
	OnModuleInit,
} from "@nestjs/common";
import * as deepmerge from "deepmerge";

import { ConfigxConfig } from "./configx-config";
import { CONFIGX_OPTIONS_SHARED_ROOT_TOKEN } from "./constants";
import { resolveConfig } from "./resolver";
import { ConfigxSharedOptions } from "./types";

/**
 * Returns the shared options from the given options.
 * @param opts
 */
const onlySharedOptions = (
	opts: ConfigxModuleRegisterOpts,
): ConfigxSharedOptions => {
	const { configs: _configs, ...sharedOpts } = opts;

	return sharedOpts;
};

export interface ConfigxModuleConfigs {
	configs?: ConfigxConfig<any>[];
}

export type ConfigxModuleRegisterOpts = ConfigxSharedOptions &
	ConfigxModuleConfigs;

@Module({})
export class ConfigxModule implements OnModuleInit {
	/**
	 * Registers the ConfigxModule in the root module.
	 *
	 * @param opts
	 */
	public static registerRoot(opts: ConfigxModuleRegisterOpts): DynamicModule {
		const sharedOpts = onlySharedOptions(opts);
		const configProviders = this.resolveConfigProviders(opts, true);

		return {
			module: ConfigxModule,
			providers: [
				{
					provide: CONFIGX_OPTIONS_SHARED_ROOT_TOKEN,
					useValue: sharedOpts,
				},
				...configProviders,
			],
			exports: configProviders,
		};
	}

	/**
	 * Registers the ConfigxModule in a feature module.
	 *
	 * @param opts
	 */
	public static register(opts: ConfigxModuleRegisterOpts): DynamicModule {
		const configProviders = this.resolveConfigProviders(opts);

		return {
			module: ConfigxModule,
			providers: configProviders,
			exports: configProviders,
		};
	}

	/**
	 * Resolves the config providers for the given options.
	 *
	 * @param opts The module register options.
	 * @param withParentSharedOptions Whether to include the parent shared options in the providers.
	 * @private
	 */
	private static resolveConfigProviders(
		opts: ConfigxModuleRegisterOpts,
		withParentSharedOptions = false,
	): FactoryProvider[] {
		// If there are no configs, return an empty array.
		if (!opts.configs || opts.configs.length === 0) {
			return [];
		}

		return opts.configs.map((config) => {
			return {
				provide: config.token,
				useFactory: async (parentSharedOptions: ConfigxSharedOptions) => {
					// Filter out the shared options from the current given options.
					let sharedOptions: ConfigxSharedOptions = onlySharedOptions(opts);

					// If the parent shared options are provided, merge them with the current shared options.
					if (withParentSharedOptions && parentSharedOptions !== undefined) {
						sharedOptions = deepmerge(
							parentSharedOptions,
							onlySharedOptions(opts),
						);
					}

					// Resolve the configuration.
					return resolveConfig({ config, sharedOptions });
				},
				inject: [
					// If the shared options should be used, inject the shared options token.
					...(withParentSharedOptions
						? [{ token: CONFIGX_OPTIONS_SHARED_ROOT_TOKEN, optional: true }]
						: []),
				],
			};
		});
	}

	public onModuleInit() {}
}
