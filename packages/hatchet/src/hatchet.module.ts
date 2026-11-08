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
import { hatchetModuleConfigToken } from "./hatchet.module-config.js";
import { ClientInterceptor, TaskInterceptor } from "./interceptor/index.js";
import {
	ClientInterceptorRegistration,
	HatchetFeatureRegistration,
	InterceptorRegistration,
} from "./internal/registrations.js";
import { hatchetClientFactory } from "./sdk/index.js";

import type { HatchetModuleConfig } from "./hatchet.module-config.js";
import type { AnyCallableRef } from "./references/index.js";
import type { AnyHostCtor } from "./references/shared.js";

/**
 * Extra options for the module (processed at module definition time).
 */
interface HatchetModuleExtras {
	/**
	 * @deprecated Use `taskInterceptors`. If both are set, they are concatenated
	 * with `interceptors` first; a class listed in both runs twice.
	 */
	interceptors?: Type<TaskInterceptor>[] | undefined;

	/**
	 * Optional task interceptor classes wrapping every task execution on the
	 * worker, including each task of a workflow.
	 * Interceptors execute in array order (first = outermost).
	 */
	taskInterceptors?: Type<TaskInterceptor>[] | undefined;

	/**
	 * Optional client interceptor classes to intercept `Client.emit` and `Client.run`.
	 * Interceptors execute in array order (first = outermost).
	 */
	clientInterceptors?: Type<ClientInterceptor>[] | undefined;
}

const { ConfigurableModuleClass } =
	new ConfigurableModuleBuilder<HatchetModuleConfig>({
		optionsInjectionToken: hatchetModuleConfigToken,
		moduleName: "HatchetModule",
	})
		.setClassMethodName("forRoot")
		.setExtras<HatchetModuleExtras>(
			{
				interceptors: undefined,
				taskInterceptors: undefined,
				clientInterceptors: undefined,
			},
			(definition, extras) => {
				const taskInterceptors = [
					// eslint-disable-next-line @typescript-eslint/no-deprecated
					...(extras.interceptors ?? []),
					...(extras.taskInterceptors ?? []),
				];

				return {
					...definition,
					global: true,
					providers: [
						...(definition.providers ?? []),

						// Store interceptor class references for later resolution via ModuleRef
						...(taskInterceptors.length
							? [
									{
										provide: InterceptorRegistration,
										useValue: new InterceptorRegistration(taskInterceptors),
									},
								]
							: []),

						...(extras.clientInterceptors?.length
							? [
									{
										provide: ClientInterceptorRegistration,
										useValue: new ClientInterceptorRegistration(
											extras.clientInterceptors,
										),
									},
								]
							: []),
					],
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
