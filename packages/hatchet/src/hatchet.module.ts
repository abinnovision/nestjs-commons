import {
	ConfigurableModuleBuilder,
	DynamicModule,
	Global,
	Module,
	Type,
} from "@nestjs/common";

import { Client } from "./client/index.js";
import { DeclarationBuilderService } from "./explorer/declaration-builder.service.js";
import { WorkerManagementService } from "./explorer/worker-management.service.js";
import {
	type HatchetModuleConfig,
	hatchetModuleConfigToken,
} from "./hatchet.module-config.js";
import { Interceptor } from "./interceptor/index.js";
import {
	HatchetFeatureRegistration,
	InterceptorRegistration,
} from "./internal/registrations.js";
import { hatchetClientFactory } from "./sdk/index.js";

import type { AnyCallableRef } from "./references/index.js";
import type { AnyHostCtor } from "./references/shared.js";

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
			(definition, extras) => ({
				...definition,
				global: true,
				providers: [
					...(definition.providers ?? []),

					// Store interceptor class references for later resolution via ModuleRef
					...(extras.interceptors?.length
						? [
								{
									provide: InterceptorRegistration,
									useValue: new InterceptorRegistration(extras.interceptors),
								},
							]
						: []),
				],
			}),
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
		const hostRefs: AnyHostCtor[] = refs.map((ref) => ref.host);

		return {
			module: HatchetFeatureModule,
			providers: [
				{
					provide: HatchetFeatureRegistration,
					useValue: new HatchetFeatureRegistration(hostRefs),
				},
			],
		};
	}
}
