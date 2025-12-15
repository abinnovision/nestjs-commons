import {
	ConfigurableModuleBuilder,
	DynamicModule,
	Global,
	Module,
	Provider,
	Type,
} from "@nestjs/common";

import { Client } from "./client";
import { DeclarationBuilderService } from "./explorer/declaration-builder.service";
import { WorkerManagementService } from "./explorer/worker-management.service";
import {
	HatchetModuleConfig,
	hatchetModuleConfigToken,
} from "./hatchet.module-config";
import { INTERCEPTORS, Interceptor } from "./interceptor";
import { HatchetFeatureRegistration } from "./internal";
import { hatchetClientFactory } from "./sdk";

import type { AnyCallableRef, AnyHostCtor } from "./ref";

/**
 * Extra options for the module (processed at module definition time).
 */
interface HatchetModuleExtras {
	/**
	 * Optional interceptor classes to intercept all task/workflow executions.
	 * Interceptors execute in array order (first = outermost).
	 */
	interceptors?: Type<Interceptor>[] | undefined;
}

const { ConfigurableModuleClass } =
	new ConfigurableModuleBuilder<HatchetModuleConfig>({
		optionsInjectionToken: hatchetModuleConfigToken,
		moduleName: "HatchetModule",
	})
		.setClassMethodName("forRoot")
		.setExtras<HatchetModuleExtras>(
			{ interceptors: undefined },
			(definition, extras) => {
				const interceptorProviders: Provider[] = extras.interceptors?.length
					? [
							...extras.interceptors,
							{
								provide: INTERCEPTORS,
								useFactory: (...interceptors: Interceptor[]) => interceptors,
								inject: extras.interceptors,
							},
						]
					: [];

				return {
					...definition,
					global: true,
					providers: [...(definition.providers ?? []), ...interceptorProviders],
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
