import {
	ConfigurableModuleBuilder,
	DynamicModule,
	Global,
	Module,
	Provider,
	Type,
} from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { Client } from "./client";
import { EXECUTION_WRAPPER, ExecutionWrapper } from "./execution-wrapper";
import { DeclarationBuilderService } from "./explorer/declaration-builder.service";
import { WorkerManagementService } from "./explorer/worker-management.service";
import {
	HatchetModuleConfig,
	hatchetModuleConfigToken,
} from "./hatchet.module-config";
import { HatchetFeatureRegistration } from "./internal";
import { hatchetClientFactory } from "./sdk";

import type { AnyCallableRef, AnyHostCtor } from "./ref";

/**
 * Extra options for the module (processed at module definition time).
 */
interface HatchetModuleExtras {
	/**
	 * Optional execution wrapper class to wrap all task/workflow executions.
	 */
	executionWrapper?: Type<ExecutionWrapper> | undefined;
}

const { ConfigurableModuleClass } =
	new ConfigurableModuleBuilder<HatchetModuleConfig>({
		optionsInjectionToken: hatchetModuleConfigToken,
		moduleName: "HatchetModule",
	})
		.setClassMethodName("forRoot")
		.setExtras<HatchetModuleExtras>(
			{ executionWrapper: undefined },
			(definition, extras) => {
				const wrapperProviders: Provider[] = extras.executionWrapper
					? [
							extras.executionWrapper,
							{
								provide: EXECUTION_WRAPPER,
								useExisting: extras.executionWrapper,
							},
						]
					: [];

				return {
					...definition,
					global: true,
					providers: [...(definition.providers ?? []), ...wrapperProviders],
				};
			},
		)
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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return
		const hostProviders: AnyHostCtor[] = refs.map((ref) => ref.host);

		return {
			module: HatchetFeatureModule,
			providers: [
				...(hostProviders as Provider[]),
				{
					provide: HatchetFeatureRegistration,
					useValue: new HatchetFeatureRegistration(hostProviders),
				},
			],
			exports: hostProviders,
		};
	}
}
