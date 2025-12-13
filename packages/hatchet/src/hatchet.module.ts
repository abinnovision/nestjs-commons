import {
	ConfigurableModuleBuilder,
	DynamicModule,
	Global,
	Module,
} from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { Client } from "./client";
import { DeclarationBuilderService } from "./explorer/declaration-builder.service";
import { WorkerManagementService } from "./explorer/worker-management.service";
import {
	HatchetModuleConfig,
	hatchetModuleConfigToken,
} from "./hatchet.module-config";
import { HatchetFeatureRegistration } from "./internal";
import { hatchetClientFactory } from "./sdk";

import type { AnyCallableRef, AnyHostCtor } from "./ref";

const { ConfigurableModuleClass } =
	new ConfigurableModuleBuilder<HatchetModuleConfig>({
		optionsInjectionToken: hatchetModuleConfigToken,
		moduleName: "HatchetModule",
	})
		.setClassMethodName("forRoot")
		.setExtras({}, (def) => ({ ...def, global: true }))
		.build();

/**
 * Module for feature registration.
 * Used by forFeature() to avoid re-instantiating core providers.
 */
@Module({})
class HatchetFeatureModule {}

@Global()
@Module({
	imports: [DiscoveryModule],
	providers: [
		hatchetClientFactory,
		Client,
		DeclarationBuilderService,
		WorkerManagementService,
	],
	exports: [Client],
})
export class HatchetModule extends ConfigurableModuleClass {
	/**
	 * Registers workflows and tasks for the global worker.
	 * Call this in feature modules to register their hosts.
	 */
	public static forFeature(...refs: AnyCallableRef[]): DynamicModule {
		const hostProviders: AnyHostCtor[] = refs.map((ref) => ref.host);

		return {
			module: HatchetFeatureModule,
			providers: [
				...(hostProviders as any[]),
				{
					provide: HatchetFeatureRegistration,
					useValue: new HatchetFeatureRegistration(hostProviders),
				},
			],
			exports: hostProviders,
		};
	}
}
