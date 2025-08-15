import { DynamicModule, Module } from "@nestjs/common";
import { ConfigurableModuleAsyncOptions } from "@nestjs/common/module-utils/interfaces/configurable-module-async-options.interface";

import { HatchetCoreModule } from "./hatchet-core.module";
import {
	HatchetModuleConfig,
	HatchetModuleWorkerRegistrationConfig,
} from "./hatchet.module-config";
import { getWorkerOptsToken } from "./internal";

@Module({})
export class HatchetModule {
	public static forRoot(options: HatchetModuleConfig): DynamicModule {
		return {
			module: HatchetModule,
			imports: [HatchetCoreModule.forRoot(options)],
		};
	}

	public static forRootAsync(
		options: ConfigurableModuleAsyncOptions<HatchetModuleConfig>,
	): DynamicModule {
		return {
			module: HatchetModule,
			imports: [HatchetCoreModule.forRootAsync(options)],
		};
	}

	public static registerWorker(
		options: HatchetModuleWorkerRegistrationConfig,
	): DynamicModule {
		const hostProviders = options.workflows.map((workflow) => workflow.host);

		return {
			module: HatchetModule,
			providers: [
				{ provide: getWorkerOptsToken(options.name), useValue: options },
				...hostProviders,
			],
			exports: hostProviders,
		};
	}
}
